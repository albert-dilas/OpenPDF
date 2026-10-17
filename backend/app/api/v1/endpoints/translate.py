from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.services.pdf_translate import PDFTranslateService, get_pdf_translate_service
from app.utils.helpers import remove_file
from app.utils.validators import validate_pdf_bytes

router = APIRouter()


@router.post("/")
async def translate_pdf_endpoint(
    file: UploadFile = File(...),
    source_lang: str = Form("auto"),
    target_lang: str = Form("es"),
    mode: str = Form("translated"),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    translate_service: PDFTranslateService = Depends(get_pdf_translate_service),
):
    """Extrae y traduce el contenido de un documento PDF usando un motor de traducción en línea."""
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    output_path = file_manager.create_output_path(extension=".pdf")

    _, pages_count = await translate_service.translate_pdf(
        input_path=temp_path,
        output_path=output_path,
        source_lang=source_lang,
        target_lang=target_lang,
        mode=mode,
    )

    file_manager.untrack(output_path)

    return FileResponse(
        path=output_path,
        filename=f"translated_{target_lang}.pdf",
        media_type="application/pdf",
        headers={"X-Translated-Pages": str(pages_count)},
        background=BackgroundTask(remove_file, output_path),
    )
