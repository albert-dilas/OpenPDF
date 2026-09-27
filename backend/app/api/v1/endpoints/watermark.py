from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from app.services.watermark_pdf import add_watermark_pdf
from app.utils.file_manager import save_upload_file_temp, cleanup_files

router = APIRouter()

@router.post("/")
async def watermark_pdf_endpoint(file: UploadFile = File(...), text: str = Form(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Archivo inválido")
    temp_path = await save_upload_file_temp(file)
    try:
        output_path = add_watermark_pdf(temp_path, text)
        return FileResponse(output_path, filename="watermarked.pdf", background=BackgroundTask(cleanup_files, [temp_path, output_path]))
    except Exception as e:
        cleanup_files([temp_path])
        raise HTTPException(500, str(e))
