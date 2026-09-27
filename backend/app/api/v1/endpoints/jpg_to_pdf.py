from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse
from typing import List
from starlette.background import BackgroundTask
import os

from app.services.jpg_to_pdf import JpgToPdfService, get_jpg_to_pdf_service
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
async def jpg_to_pdf_endpoint(
    files: List[UploadFile] = File(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    service: JpgToPdfService = Depends(get_jpg_to_pdf_service)
):
    temp_paths = []
    for f in files:
        if not (f.filename.lower().endswith(".jpg") or f.filename.lower().endswith(".jpeg") or f.filename.lower().endswith(".png")):
            raise InvalidFormatError("Archivos inválidos, solo JPG/PNG")
        temp_paths.append(await file_manager.save_upload_file(f))
        
    output_path = file_manager.create_output_path()
    
    await service.convert_jpg_to_pdf(temp_paths, output_path)
    
    file_manager.untrack(output_path)
    
    return FileResponse(
        path=output_path,
        filename="converted.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path)
    )
