from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from app.services.pdf_to_jpg import convert_pdf_to_jpg
from app.utils.file_manager import save_upload_file_temp_validated, cleanup_files
from app.utils.validators import validate_pdf_bytes

router = APIRouter()

@router.post("/")
async def pdf_to_jpg_endpoint(file: UploadFile = File(...)):
    temp_path = None
    try:
        temp_path = await save_upload_file_temp_validated(file, validate_pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    try:
        output_path = convert_pdf_to_jpg(temp_path)
        return FileResponse(
            output_path,
            filename="converted_images.zip",
            media_type="application/zip",
            background=BackgroundTask(cleanup_files, [temp_path, output_path])
        )
    except Exception as e:
        cleanup_files([temp_path])
        raise HTTPException(500, str(e))
