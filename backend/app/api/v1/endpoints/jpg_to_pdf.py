from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from typing import List
from starlette.background import BackgroundTask
from app.services.jpg_to_pdf import convert_jpg_to_pdf
from app.utils.file_manager import save_upload_file_temp, cleanup_files

router = APIRouter()

@router.post("/")
async def jpg_to_pdf_endpoint(files: List[UploadFile] = File(...)):
    temp_paths = []
    for f in files:
        if not (f.filename.lower().endswith(".jpg") or f.filename.lower().endswith(".jpeg") or f.filename.lower().endswith(".png")):
            cleanup_files(temp_paths)
            raise HTTPException(status_code=400, detail="Archivos inválidos, solo JPG/PNG")
        temp_paths.append(await save_upload_file_temp(f))
        
    try:
        output_path = convert_jpg_to_pdf(temp_paths)
        return FileResponse(output_path, filename="converted.pdf", background=BackgroundTask(cleanup_files, temp_paths + [output_path]))
    except Exception as e:
        cleanup_files(temp_paths)
        raise HTTPException(500, str(e))
