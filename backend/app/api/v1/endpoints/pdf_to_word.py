from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os

from app.utils.helpers import remove_file
from app.services.pdf_to_word import PDFToWordService, get_pdf_to_word_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.core.exceptions import InvalidFormatError
from app.utils.validators import validate_pdf_bytes

router = APIRouter()

@router.post("/")
async def pdf_to_word_endpoint(
    file: UploadFile = File(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    service: PDFToWordService = Depends(get_pdf_to_word_service)
):
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    output_path = file_manager.create_output_path(extension=".docx")

    await service.convert_pdf_to_word(temp_path, output_path)
    
    file_manager.untrack(output_path)
    
    return FileResponse(
        output_path,
        filename="converted.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        background=BackgroundTask(remove_file, output_path)
    )
