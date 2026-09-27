from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from app.services.pdf_protector import protect_pdf
from app.utils.file_manager import save_upload_file_temp_validated, cleanup_files
from app.utils.validators import validate_pdf_bytes

router = APIRouter()

@router.post("/")
async def protect_pdf_endpoint(file: UploadFile = File(...), password: str = Form(...)):
    temp_path = None
    try:
        temp_path = await save_upload_file_temp_validated(file, validate_pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    try:
        output_path = protect_pdf(temp_path, password)
        return FileResponse(
            output_path,
            filename="protected.pdf",
            media_type="application/pdf",
            background=BackgroundTask(cleanup_files, [temp_path, output_path])
        )
    except Exception as e:
        cleanup_files([temp_path])
        raise HTTPException(500, str(e))
