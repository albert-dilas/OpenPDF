from fastapi import APIRouter, UploadFile, File, Depends
from app.services.pdf_info import PDFInfoService, get_pdf_info_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.utils.validators import validate_pdf_bytes

router = APIRouter()


@router.post("/")
async def pdf_info_endpoint(
    file: UploadFile = File(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    pdf_info_service: PDFInfoService = Depends(get_pdf_info_service),
):
    """Inspecciona un archivo PDF y retorna metadatos, dimensiones y miniaturas base64 por página."""
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    return await pdf_info_service.get_pdf_info(temp_path)
