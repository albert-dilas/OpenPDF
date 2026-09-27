from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse
from typing import List
from starlette.background import BackgroundTask
import os

from app.utils.helpers import remove_file
from app.services.pdf_merger import PDFMergerService, get_pdf_merger_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.core.exceptions import BusinessRuleError, InvalidFormatError
from app.utils.validators import validate_pdf_bytes

router = APIRouter()

@router.post("/")
async def merge_pdf_endpoint(
    files: List[UploadFile] = File(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    merger_service: PDFMergerService = Depends(get_pdf_merger_service)
):
    if len(files) < 2:
        raise BusinessRuleError("Debes enviar al menos 2 archivos para unir.")
        
    temp_input_paths = []
    
    # 1. Guardar archivos temporalmente (file_manager se asegura de borrarlos al final)
    for file in files:
        temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
        temp_input_paths.append(temp_path)
        
    # 2. Obtener ruta temporal para salida
    output_path = file_manager.create_output_path()

    # 3. Ejecutar lógica de negocio (asíncrona y en threadpool, no bloqueante)
    await merger_service.merge_pdfs(temp_input_paths, output_path)
    
    # Destrackear output_path para que file_manager.cleanup no lo borre antes de devolverlo
    file_manager.untrack(output_path)
    
    # 4. Retornar archivo, usando BackgroundTask para limpiarlo al terminar la descarga
    return FileResponse(
        path=output_path,
        filename="openpdf_merged.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path)
    )
