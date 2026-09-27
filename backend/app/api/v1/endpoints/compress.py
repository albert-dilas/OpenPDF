from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from app.services.pdf_compressor import compress_pdf
from app.utils.file_manager import save_upload_file_temp_validated, cleanup_files
from app.utils.validators import validate_pdf_bytes

router = APIRouter()

@router.post("/")
async def compress_pdf_endpoint(file: UploadFile = File(...)):
    temp_path = None
    try:
        temp_path = await save_upload_file_temp_validated(file, validate_pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    try:
        output_path = compress_pdf(temp_path)
        return FileResponse(
            output_path,
            filename="compressed.pdf",
            media_type="application/pdf",
            background=BackgroundTask(cleanup_files, [temp_path, output_path])
        )
    except Exception as e:
        cleanup_files([temp_path])
        raise HTTPException(500, str(e))
