from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os

from app.services.word_to_pdf import WordToPDFService, get_word_to_pdf_service
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
async def word_to_pdf_endpoint(
    file: UploadFile = File(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    word_to_pdf_service: WordToPDFService = Depends(get_word_to_pdf_service)
):
    if not (file.filename.lower().endswith(".doc") or file.filename.lower().endswith(".docx")):
        raise InvalidFormatError("Archivo inválido. Se requiere .doc o .docx")
        
    temp_path = await file_manager.save_upload_file(file)
    output_path = file_manager.create_output_path(extension=".pdf")
    
    await word_to_pdf_service.convert_word_to_pdf(temp_path, output_path)
    
    file_manager.untrack(output_path)
    
    return FileResponse(
        path=output_path,
        filename="converted.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path)
    )
