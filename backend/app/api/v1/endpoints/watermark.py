from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os

from app.utils.helpers import remove_file
from app.services.watermark_pdf import PDFWatermarkService, get_pdf_watermark_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.core.exceptions import InvalidFormatError
from app.utils.validators import validate_pdf_bytes

router = APIRouter()

@router.post("/")
async def watermark_pdf_endpoint(
    file: UploadFile = File(...), 
    text: str = Form(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    watermark_service: PDFWatermarkService = Depends(get_pdf_watermark_service)
):
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    output_path = file_manager.create_output_path(extension=".pdf")
    
    await watermark_service.add_watermark_pdf(temp_path, text, output_path)
    
    file_manager.untrack(output_path)
    
    return FileResponse(
        path=output_path,
        filename="watermarked.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path)
    )
