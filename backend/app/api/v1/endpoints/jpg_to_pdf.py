from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse
from typing import List
from starlette.background import BackgroundTask
import os

from app.utils.helpers import remove_file
from app.services.jpg_to_pdf import JpgToPdfService, get_jpg_to_pdf_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.core.exceptions import InvalidFormatError
from app.utils.validators import validate_image_bytes

router = APIRouter()

@router.post("/")
async def jpg_to_pdf_endpoint(
    files: List[UploadFile] = File(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    service: JpgToPdfService = Depends(get_jpg_to_pdf_service)
):
    temp_paths = []
    for f in files:
        temp_paths.append(await file_manager.save_upload_file(f, validate_fn=validate_image_bytes))
        
    output_path = file_manager.create_output_path()
    
    await service.convert_jpg_to_pdf(temp_paths, output_path)
    
    file_manager.untrack(output_path)
    
    return FileResponse(
        path=output_path,
        filename="converted.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path)
    )
