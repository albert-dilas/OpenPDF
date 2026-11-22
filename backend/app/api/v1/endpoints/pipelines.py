"""Ejecutor lineal de Flujos Automáticos (Pipelines) y gestión de recetas locales en 127.0.0.1."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List
import json
import shutil
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from starlette.background import BackgroundTask

from app.core.config import settings
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.services import studio_tools_service as svc
from app.services.page_numbers_pdf import PageNumbersService
from app.services.pdf_compressor import PDFCompressorService
from app.services.pdf_metadata import PDFMetadataService
from app.services.pdf_protector import PDFProtectorService
from app.services.pdf_redact import PDFRedactService
from app.services.pdf_to_markdown import PDFToMarkdownService
from app.services.watermark_pdf import PDFWatermarkService
from app.utils.helpers import remove_file

router = APIRouter()


class PipelineRecipeIn(BaseModel):
    title: str = Field(..., min_length=2, max_length=90)
    description: str = Field(default="", max_length=240)
    domain: str = Field(default="pdf")
    steps: List[str] = Field(..., min_length=1, max_length=5)


def _recipes_file() -> Path:
    recipes_dir = settings.USER_DATA_DIR / "recipes"
    recipes_dir.mkdir(parents=True, exist_ok=True)
    return recipes_dir / "custom_recipes.json"


def _load_custom_recipes() -> List[Dict[str, Any]]:
    path = _recipes_file()
    if not path.is_file():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_custom_recipes(items: List[Dict[str, Any]]) -> None:
    _recipes_file().write_text(
        json.dumps(items, indent=2, ensure_ascii=False), encoding="utf-8"
    )


@router.get("/recipes")
async def list_pipeline_recipes() -> Dict[str, Any]:
    return {"items": _load_custom_recipes()}


@router.post("/recipes")
async def create_pipeline_recipe(payload: PipelineRecipeIn) -> Dict[str, Any]:
    items = _load_custom_recipes()
    new_item = {
        "id": f"custom-{uuid.uuid4().hex[:8]}",
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "domain": payload.domain.strip() or "pdf",
        "steps": [s.strip() for s in payload.steps if s.strip()],
        "custom": True,
    }
    items.insert(0, new_item)
    _save_custom_recipes(items[:50])
    return new_item


@router.delete("/recipes/{recipe_id}")
async def delete_pipeline_recipe(recipe_id: str) -> Dict[str, Any]:
    items = [r for r in _load_custom_recipes() if r.get("id") != recipe_id]
    _save_custom_recipes(items)
    return {"deleted": True, "id": recipe_id}


@router.post("/execute")
@router.post("/execute/")
async def execute_pipeline_endpoint(
    file: UploadFile = File(...),
    steps: str = Form(...),
    watermark_text: str = Form("CONFIDENCIAL"),
    password: str = Form(""),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
):
    """Ejecuta una secuencia lineal de pasos locales pasando la salida de cada etapa a la siguiente."""
    step_list = [s.strip() for s in steps.split(",") if s.strip()]
    if not step_list:
        raise HTTPException(status_code=400, detail="Selecciona al menos un paso para el flujo.")

    current_path = await file_manager.save_upload_file(file)
    orig_name = file.filename or "documento.pdf"
    stem = Path(orig_name).stem or "archivo"
    final_name = f"{stem}_flujo.pdf"
    final_mime = "application/pdf"

    compressor = PDFCompressorService()
    watermarker = PDFWatermarkService()
    pager = PageNumbersService()
    meta_svc = PDFMetadataService()
    redactor = PDFRedactService()
    protector = PDFProtectorService()
    md_svc = PDFToMarkdownService()

    for step_id in step_list[:5]:
        next_path = file_manager.create_output_path()

        if step_id == "pdf-repair":
            final_name, final_mime = svc.process_pdf_repair(current_path, next_path)
        elif step_id == "compress-pdf":
            await compressor.compress_pdf(current_path, next_path, level="medium")
            final_name, final_mime = f"{stem}_comprimido.pdf", "application/pdf"
        elif step_id == "watermark-pdf":
            await watermarker.add_watermark_pdf(
                current_path, text=watermark_text or "CONFIDENCIAL", output_path=next_path
            )
            final_name, final_mime = f"{stem}_sellado.pdf", "application/pdf"
        elif step_id == "page-numbers-pdf":
            await pager.add_page_numbers_pdf(current_path, next_path)
            final_name, final_mime = f"{stem}_numerado.pdf", "application/pdf"
        elif step_id == "metadata-clean":
            await meta_svc.update_metadata(
                current_path, next_path, title="", author="", subject="", keywords=""
            )
            final_name, final_mime = f"{stem}_sin_metadatos.pdf", "application/pdf"
        elif step_id == "redact-pii":
            await redactor.redact_pdf(
                current_path,
                next_path,
                terms="",
                redact_emails=True,
                redact_phones=True,
                redact_ids=True,
                redact_urls=False,
            )
            final_name, final_mime = f"{stem}_anonimizado.pdf", "application/pdf"
        elif step_id == "protect-pdf":
            pwd = password.strip() or "Tornio2026"
            await protector.protect_pdf(current_path, next_path, password=pwd)
            final_name, final_mime = f"{stem}_protegido.pdf", "application/pdf"
        elif step_id == "pdf-to-markdown":
            await md_svc.convert_pdf_to_markdown(current_path, next_path)
            final_name, final_mime = f"{stem}.md", "text/markdown"
        elif step_id == "ai-doc-summary":
            final_name, final_mime = svc.process_ai_doc_summary(current_path, orig_name, next_path)
        elif step_id == "pdf-tables-csv":
            final_name, final_mime = svc.process_pdf_tables_csv(current_path, next_path)
        elif step_id == "image-exif-strip":
            final_name, final_mime = svc.process_image_exif_strip(current_path, next_path)
        elif step_id == "image-enhance-scan":
            final_name, final_mime = svc.process_image_convert(
                current_path, next_path, target_format="png", enhance_mode="document_scan"
            )
        elif step_id == "image-convert-webp":
            final_name, final_mime = svc.process_image_convert(
                current_path, next_path, target_format="webp", enhance_mode="none"
            )
        elif step_id == "image-bg-remove":
            final_name, final_mime = svc.process_image_bg_remove(current_path, next_path)
        elif step_id == "audio-denoise":
            final_name, final_mime = svc.process_audio_denoise(current_path, next_path)
        elif step_id == "audio-normalize":
            final_name, final_mime = svc.process_audio_normalize(current_path, next_path, target_lufs="-16")
        elif step_id == "file-vault":
            pwd = password.strip() or "Tornio2026"
            final_name, final_mime = svc.process_file_vault(
                current_path, final_name, next_path, password=pwd, mode="encrypt"
            )
        else:
            shutil.copyfile(current_path, next_path)

        current_path = next_path

    file_manager.untrack(current_path)
    return FileResponse(
        path=current_path,
        filename=final_name,
        media_type=final_mime,
        headers={"X-Pipeline-Steps": str(len(step_list))},
        background=BackgroundTask(remove_file, current_path),
    )
