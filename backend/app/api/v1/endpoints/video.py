"""Endpoints del estudio piloto de video con FFmpeg y progreso en tiempo real via JobManager."""
import os
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.core.exceptions import BusinessRuleError
from app.core.jobs import JobManager, get_job_manager
from app.services.media_video import MediaVideoService, get_media_video_service

router = APIRouter()


@router.post("/inspect")
async def inspect_video_endpoint(
    file: Optional[UploadFile] = File(None),
    asset_id: Optional[str] = Form(None),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    video_service: MediaVideoService = Depends(get_media_video_service),
    manager: JobManager = Depends(get_job_manager),
):
    """Inspecciona un video subido o un asset de sesion existente usando ffprobe."""
    if asset_id and asset_id.strip():
        asset = manager.get_asset(asset_id.strip())
        if not asset or not os.path.isfile(asset.path):
            raise HTTPException(status_code=404, detail="Asset de sesion no encontrado.")
        return await video_service.inspect_video_file(asset.path, asset.filename, asset_id=asset.id)

    if file is not None:
        temp_path = await file_manager.save_upload_file(file)
        return await video_service.inspect_video_file(
            temp_path,
            os.path.basename(file.filename or "video"),
            asset_id=None,
        )

    raise BusinessRuleError("Debes proporcionar un archivo de video o un asset_id valido.")


@router.post("/process-job", status_code=202)
async def process_video_job_endpoint(
    file: Optional[UploadFile] = File(None),
    asset_id: Optional[str] = Form(None),
    start_sec: Optional[float] = Form(None),
    end_sec: Optional[float] = Form(None),
    output_format: str = Form("mp4"),
    quality: str = Form("medium"),
    resolution: str = Form("original"),
    remove_audio: bool = Form(False),
    fast_copy: bool = Form(False),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    video_service: MediaVideoService = Depends(get_media_video_service),
    manager: JobManager = Depends(get_job_manager),
):
    """Encola un trabajo asincrono FFmpeg para recortar o convertir video y retorna HTTP 202."""
    owns_input = False
    source_path: Optional[str] = None
    source_filename = "video.mp4"

    if asset_id and asset_id.strip():
        asset = manager.get_asset(asset_id.strip())
        if not asset or not os.path.isfile(asset.path):
            raise HTTPException(status_code=404, detail="Asset de sesion no encontrado.")
        source_path = asset.path
        source_filename = asset.filename
        owns_input = False
    elif file is not None:
        source_path = await file_manager.save_upload_file(file)
        source_filename = os.path.basename(file.filename or "video.mp4")
        owns_input = True
    else:
        raise BusinessRuleError("Debes proporcionar un archivo de video o un asset_id valido.")

    try:
        if owns_input and source_path:
            file_manager.untrack(source_path)

        job = await video_service.start_process_job(
            input_path=source_path,
            source_filename=source_filename,
            owns_input=owns_input,
            start_sec=start_sec,
            end_sec=end_sec,
            output_format=output_format,
            quality=quality,
            resolution=resolution,
            remove_audio=remove_audio,
            fast_copy=fast_copy,
            manager=manager,
        )
        return JSONResponse(status_code=202, content={"job": job.to_public_dict()})
    except Exception:
        if owns_input and source_path and os.path.isfile(source_path):
            try:
                os.remove(source_path)
            except OSError:
                pass
        raise
