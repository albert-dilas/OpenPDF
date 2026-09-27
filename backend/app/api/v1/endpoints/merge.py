from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from typing import List
import os
from starlette.background import BackgroundTask

from app.services.pdf_merger import merge_pdfs
from app.utils.file_manager import save_upload_file_temp, cleanup_files

router = APIRouter()

@router.post("/")
async def merge_pdf_endpoint(files: List[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Debes enviar al menos 2 archivos para unir.")
        
    temp_input_paths = []
    output_path = None
    
    try:
        # 1. Guardar archivos temporalmente
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail=f"El archivo {file.filename} no es un PDF válido.")
            temp_path = await save_upload_file_temp(file)
            temp_input_paths.append(temp_path)
            
        # 2. Ejecutar lógica de negocio
        output_path = merge_pdfs(temp_input_paths)
        
        # 3. Retornar archivo, y configurar tarea en segundo plano para limpiar la basura
        files_to_cleanup = temp_input_paths + [output_path]
        return FileResponse(
            path=output_path,
            filename="openpdf_merged.pdf",
            media_type="application/pdf",
            background=BackgroundTask(cleanup_files, files_to_cleanup)
        )
        
    except Exception as e:
        # Limpiar inputs si hubo error
        cleanup_files(temp_input_paths)
        if output_path and os.path.exists(output_path):
            cleanup_files([output_path])
        raise HTTPException(status_code=500, detail=str(e))
