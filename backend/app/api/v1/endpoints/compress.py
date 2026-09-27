from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os

from app.services.pdf_compressor import PDFCompressorService, get_pdf_compressor_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.core.exceptions import InvalidFormatError
from app.utils.validators import validate_pdf_bytes

router = APIRouter()

def remove_file(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass

@router.post("/")
async def compress_pdf_endpoint(
    file: UploadFile = File(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    compressor_service: PDFCompressorService = Depends(get_pdf_compressor_service)
):
    if not file.filename.lower().endswith('.pdf'):
        raise InvalidFormatError("El archivo no es un PDF válido.")
        
    temp_path = await file_manager.save_upload_file(file)
    output_path = file_manager.create_output_path()

    await compressor_service.compress_pdf(temp_path, output_path)
    
    file_manager.untrack(output_path)
    
    return FileResponse(
        path=output_path,
        filename="compressed.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path)
    )
