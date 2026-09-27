from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from app.services.pdf_to_word import convert_pdf_to_word
from app.utils.file_manager import save_upload_file_temp, cleanup_files

router = APIRouter()

@router.post("/")
async def pdf_to_word_endpoint(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Archivo inválido")
    temp_path = await save_upload_file_temp(file)
    try:
        output_path = convert_pdf_to_word(temp_path)
        return FileResponse(output_path, filename="converted.docx", background=BackgroundTask(cleanup_files, [temp_path, output_path]))
    except Exception as e:
        cleanup_files([temp_path])
        raise HTTPException(500, str(e))
