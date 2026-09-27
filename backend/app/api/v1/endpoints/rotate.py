from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os

from app.services.pdf_rotator import PDFRotatorService, get_pdf_rotator_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.core.exceptions import InvalidFormatError

router = APIRouter()

def remove_file(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass

@router.post("/")
async def rotate_pdf_endpoint(
    file: UploadFile = File(...),
    degrees: int = Form(90),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    rotator_service: PDFRotatorService = Depends(get_pdf_rotator_service)
):
    if not file.filename.lower().endswith('.pdf'):
        raise InvalidFormatError(f"El archivo {file.filename} no es un PDF válido.")
        
    temp_path = await file_manager.save_upload_file(file)
    output_path = file_manager.create_output_path()

    await rotator_service.rotate_pdf(temp_path, output_path, degrees)
    
    file_manager.untrack(output_path)
    
    return FileResponse(
        output_path,
        filename="rotated.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path)
    )
