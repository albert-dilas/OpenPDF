from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from app.services.ocr_pdf import ocr_pdf
from app.utils.file_manager import save_upload_file_temp, cleanup_files

router = APIRouter()

@router.post("/")
async def ocr_pdf_endpoint(file: UploadFile = File(...), language: str = Form("spa")):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Archivo inválido")
    temp_path = await save_upload_file_temp(file)
    try:
        output_path = ocr_pdf(temp_path, language)
        return FileResponse(output_path, filename="ocr_searchable.pdf", background=BackgroundTask(cleanup_files, [temp_path, output_path]))
    except Exception as e:
        cleanup_files([temp_path])
        raise HTTPException(500, str(e))
