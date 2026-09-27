from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os

from app.services.pdf_to_markdown import PDFToMarkdownService, get_pdf_to_markdown_service
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
async def pdf_to_markdown_endpoint(
    file: UploadFile = File(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    service: PDFToMarkdownService = Depends(get_pdf_to_markdown_service)
):
    if not file.filename.lower().endswith(".pdf"):
        raise InvalidFormatError(f"El archivo {file.filename} no es un PDF válido.")
        
    temp_path = await file_manager.save_upload_file(file)
    output_path = file_manager.create_output_path(extension=".md")

    await service.convert_pdf_to_markdown(temp_path, output_path)
    
    file_manager.untrack(output_path)
    
    return FileResponse(
        output_path,
        filename="converted.md",
        media_type="text/markdown",
        background=BackgroundTask(remove_file, output_path)
    )
