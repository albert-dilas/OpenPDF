from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os

from app.utils.helpers import remove_file
from app.services.pdf_rotator import PDFRotatorService, get_pdf_rotator_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.core.exceptions import InvalidFormatError
from app.utils.validators import validate_pdf_bytes

router = APIRouter()

@router.post("/")
async def rotate_pdf_endpoint(
    file: UploadFile = File(...),
    degrees: int = Form(90),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    rotator_service: PDFRotatorService = Depends(get_pdf_rotator_service)
):
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    output_path = file_manager.create_output_path()

    await rotator_service.rotate_pdf(temp_path, output_path, degrees)
    
    file_manager.untrack(output_path)
    
    return FileResponse(
        output_path,
        filename="rotated.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path)
    )
