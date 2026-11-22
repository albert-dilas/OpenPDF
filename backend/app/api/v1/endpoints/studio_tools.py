"""Router unificado para las 35 herramientas de Fase 2 en los 7 Studios de Tornio v3.0."""

from __future__ import annotations

from pathlib import Path
from typing import List, Optional
import os

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.services import studio_tools_service as svc
from app.utils.helpers import remove_file
from app.utils.validators import validate_pdf_bytes

router = APIRouter()


@router.post("/{tool_id}")
@router.post("/{tool_id}/")
async def execute_studio_tool(
    tool_id: str,
    file: Optional[UploadFile] = File(None),
    files: Optional[List[UploadFile]] = File(None),
    target_format: str = Form("webp"),
    enhance_mode: str = Form("none"),
    quality_level: str = Form("medium"),
    width: str = Form("1280"),
    height: str = Form("720"),
    mode: str = Form("fit"),
    password: str = Form(""),
    expected_hash: str = Form(""),
    regex_pattern: str = Form(""),
    replacement: str = Form(""),
    raw_items: str = Form(""),
    custom_text: str = Form(""),
    url: str = Form(""),
    start_sec: str = Form("0"),
    end_sec: str = Form("30"),
    target_lufs: str = Form("-14"),
    bitrate: str = Form("192k"),
    title: str = Form(""),
    artist: str = Form(""),
    album: str = Form(""),
    factor: str = Form("1.5"),
    fps: str = Form("12"),
    subtitle_text: str = Form(""),
    chunk_size: str = Form("800"),
    overlap: str = Form("120"),
    language: str = Form("es"),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
):
    upload_list: List[UploadFile] = []
    if files:
        upload_list.extend([u for u in files if u and u.filename])
    if file and file.filename:
        upload_list.append(file)

    saved_paths: List[str] = []
    original_names: List[str] = []

    pdf_only_tools = {"pdf-diff", "pdf-tables-csv", "pdf-repair"}
    validator = validate_pdf_bytes if tool_id in pdf_only_tools else None

    for up in upload_list:
        p = await file_manager.save_upload_file(up, validate_fn=validator)
        saved_paths.append(p)
        original_names.append(up.filename or Path(p).name)

    primary_path = saved_paths[0] if saved_paths else None
    primary_name = original_names[0] if original_names else "archivo"

    output_path = file_manager.create_output_path()

    # 1. STUDIO DOCUMENTOS EXTRAS
    if tool_id == "pdf-diff":
        if not saved_paths:
            raise HTTPException(status_code=400, detail="Sube al menos un archivo PDF para comparar.")
        out_name, media_type = svc.process_pdf_diff(saved_paths, output_path)

    elif tool_id == "pdf-tables-csv":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo PDF para extraer tablas.")
        out_name, media_type = svc.process_pdf_tables_csv(primary_path, output_path)

    elif tool_id == "pdf-repair":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo PDF para reparar.")
        out_name, media_type = svc.process_pdf_repair(primary_path, output_path)

    # 2. STUDIO VIDEO
    elif tool_id == "video-to-gif":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo de video.")
        out_name, media_type = svc.process_video_to_gif(
            primary_path, output_path, fps=int(fps or 12), width=int(width or 480)
        )

    elif tool_id == "video-extract-audio":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo de video.")
        out_name, media_type = svc.process_video_extract_audio(
            primary_path, output_path, audio_format=target_format or "mp3"
        )

    elif tool_id == "video-compress":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo de video.")
        out_name, media_type = svc.process_video_compress(
            primary_path, output_path, preset_level=quality_level or "medium"
        )

    elif tool_id == "video-thumbnails":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo de video.")
        out_name, media_type = svc.process_video_thumbnails(primary_path, output_path)

    elif tool_id == "video-burn-subtitles":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo de video.")
        out_name, media_type = svc.process_video_burn_subtitles(
            primary_path, output_path, subtitle_text=subtitle_text
        )

    elif tool_id == "video-merge":
        if not saved_paths:
            raise HTTPException(status_code=400, detail="Sube los clips de video a unir.")
        out_name, media_type = svc.process_video_merge(saved_paths, output_path)

    elif tool_id == "video-speed":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo de video.")
        out_name, media_type = svc.process_video_speed(primary_path, output_path, factor=factor)

    # 3. STUDIO AUDIO
    elif tool_id == "audio-convert":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo de audio.")
        out_name, media_type = svc.process_audio_convert(
            primary_path, output_path, target_format=target_format or "mp3", bitrate=bitrate
        )

    elif tool_id == "audio-trim":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo de audio.")
        out_name, media_type = svc.process_audio_trim(
            primary_path, output_path, start_sec=start_sec, end_sec=end_sec
        )

    elif tool_id == "audio-normalize":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo de audio.")
        out_name, media_type = svc.process_audio_normalize(
            primary_path, output_path, target_lufs=target_lufs
        )

    elif tool_id == "audio-denoise":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo de audio.")
        out_name, media_type = svc.process_audio_denoise(primary_path, output_path)

    elif tool_id == "audio-merge":
        if not saved_paths:
            raise HTTPException(status_code=400, detail="Sube las pistas de audio a unir.")
        out_name, media_type = svc.process_audio_merge(saved_paths, output_path)

    elif tool_id == "audio-metadata":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo de audio.")
        out_name, media_type = svc.process_audio_metadata(
            primary_path, output_path, title=title, artist=artist, album=album
        )

    # 4. STUDIO IMAGENES & IA VISUAL
    elif tool_id == "image-convert":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube una imagen para convertir.")
        out_name, media_type = svc.process_image_convert(
            primary_path, output_path, target_format=target_format, enhance_mode=enhance_mode
        )

    elif tool_id == "image-compress":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube una imagen para optimizar.")
        out_name, media_type = svc.process_image_compress(
            primary_path, output_path, quality_level=quality_level
        )

    elif tool_id == "image-resize-crop":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube una imagen para redimensionar.")
        out_name, media_type = svc.process_image_resize_crop(
            primary_path, output_path, width=width, height=height, mode=mode
        )

    elif tool_id == "image-exif-strip":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube una imagen para limpiar sus metadatos EXIF.")
        out_name, media_type = svc.process_image_exif_strip(primary_path, output_path)

    elif tool_id == "image-bg-remove":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube una imagen para quitar el fondo.")
        out_name, media_type = svc.process_image_bg_remove(primary_path, output_path)

    elif tool_id == "image-ico-favicon":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube una imagen para generar el icono ICO.")
        out_name, media_type = svc.process_image_ico_favicon(primary_path, output_path)

    elif tool_id == "image-palette":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube una imagen para extraer su paleta.")
        out_name, media_type = svc.process_image_palette(primary_path, output_path)

    # 5. STUDIO ARCHIVOS, SEGURIDAD Y DEV LAB
    elif tool_id == "archive-pack":
        if not saved_paths:
            raise HTTPException(status_code=400, detail="Sube al menos un archivo.")
        out_name, media_type = svc.process_archive_pack(
            saved_paths, original_names, output_path, mode=mode or "zip"
        )

    elif tool_id == "file-hash-verify":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo para calcular sus huellas SHA-256.")
        out_name, media_type = svc.process_file_hash_verify(
            primary_path, primary_name, output_path, expected_hash=expected_hash
        )

    elif tool_id == "file-vault":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo para cifrar o descifrar.")
        out_name, media_type = svc.process_file_vault(
            primary_path, primary_name, output_path, password=password, mode=mode or "encrypt"
        )

    elif tool_id == "data-transform":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo JSON, YAML o CSV.")
        out_name, media_type = svc.process_data_transform(
            primary_path, primary_name, output_path, target_format=target_format or "json"
        )

    elif tool_id == "regex-diff-lab":
        if not saved_paths:
            raise HTTPException(status_code=400, detail="Sube al menos un archivo de texto.")
        out_name, media_type = svc.process_regex_diff_lab(
            saved_paths, output_path, regex_pattern=regex_pattern, replacement=replacement
        )

    elif tool_id == "qr-barcode-batch":
        out_name, media_type = svc.process_qr_barcode_batch(
            primary_path, output_path, raw_items=raw_items
        )

    # 6. STUDIO IA LOCAL CPU
    elif tool_id == "ai-transcribe":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un archivo de audio o video para transcribir.")
        out_name, media_type = svc.process_ai_transcribe(
            primary_path,
            primary_name,
            output_path,
            output_format=target_format or "srt",
            language=language or "es",
        )

    elif tool_id == "ai-tts-local":
        out_name, media_type = svc.process_ai_tts_local(
            primary_path, output_path, custom_text=custom_text
        )

    elif tool_id == "ai-doc-summary":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un documento PDF, Markdown o TXT.")
        out_name, media_type = svc.process_ai_doc_summary(
            primary_path, primary_name, output_path
        )

    elif tool_id == "ai-doc-chunks":
        if not primary_path:
            raise HTTPException(status_code=400, detail="Sube un documento PDF, Markdown o TXT.")
        out_name, media_type = svc.process_ai_doc_chunks(
            primary_path,
            primary_name,
            output_path,
            chunk_size=int(chunk_size or 800),
            overlap=int(overlap or 120),
        )

    # 7. STUDIO WEB & ONLINE CAPTURE
    elif tool_id == "web-markdown-clip":
        if not url.strip():
            raise HTTPException(status_code=400, detail="Ingresa una URL pública válida.")
        out_name, media_type = svc.process_web_markdown_clip(url.strip(), output_path)

    elif tool_id == "web-headers-ssl":
        if not url.strip():
            raise HTTPException(status_code=400, detail="Ingresa una URL pública válida.")
        out_name, media_type = svc.process_web_headers_ssl(url.strip(), output_path)

    elif tool_id == "yt-dlp-capture":
        if not url.strip():
            raise HTTPException(status_code=400, detail="Ingresa una URL pública válida.")
        out_name, media_type = svc.process_yt_dlp_capture(
            url.strip(), output_path, format_mode=target_format or "mp4"
        )

    else:
        raise HTTPException(status_code=404, detail=f"Herramienta '{tool_id}' no registrada.")

    file_manager.untrack(output_path)

    return FileResponse(
        path=output_path,
        filename=out_name,
        media_type=media_type,
        background=BackgroundTask(remove_file, output_path),
    )
