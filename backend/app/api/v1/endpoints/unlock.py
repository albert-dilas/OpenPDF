from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os

from app.utils.helpers import remove_file
from app.services.unlock_pdf import PDFUnlockerService, get_pdf_unlocker_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.core.exceptions import InvalidFormatError
from app.utils.validators import validate_pdf_bytes

router = APIRouter()

@router.post("/")
async def unlock_pdf_endpoint(
    file: UploadFile = File(...), 
    password: str = Form(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    unlocker_service: PDFUnlockerService = Depends(get_pdf_unlocker_service)
):
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    output_path = file_manager.create_output_path(extension=".pdf")
    
    await unlocker_service.unlock_pdf(temp_path, password, output_path)
    
    file_manager.untrack(output_path)
    
    return FileResponse(
        path=output_path,
        filename="unlocked.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path)
    )
