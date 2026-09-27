from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os

from app.utils.helpers import remove_file
from app.services.word_to_pdf import WordToPDFService, get_word_to_pdf_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.core.exceptions import InvalidFormatError
from app.utils.validators import validate_word_bytes

router = APIRouter()

@router.post("/")
async def word_to_pdf_endpoint(
    file: UploadFile = File(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    word_to_pdf_service: WordToPDFService = Depends(get_word_to_pdf_service)
):
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_word_bytes)
    output_path = file_manager.create_output_path(extension=".pdf")
    
    await word_to_pdf_service.convert_word_to_pdf(temp_path, output_path)
    
    file_manager.untrack(output_path)
    
    return FileResponse(
        path=output_path,
        filename="converted.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path)
    )
