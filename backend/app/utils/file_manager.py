import os
import uuid
from fastapi import UploadFile
from app.core.config import settings
import shutil
from typing import Callable


async def save_upload_file_temp(upload_file: UploadFile) -> str:
    """Guarda un archivo subido en el directorio temporal y retorna la ruta."""
    extension = os.path.splitext(upload_file.filename)[1].lower()
    temp_name = f"{uuid.uuid4().hex}{extension}"
    temp_path = os.path.join(settings.TEMP_DIR, temp_name)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
        
    return temp_path


async def save_upload_file_temp_validated(upload_file: UploadFile, validate_fn: Callable[[bytes], bool]) -> str:
    """
    Guarda un archivo subido, valida su contenido por magic bytes y retorna la ruta.
    Lanza ValueError si el archivo no pasa la validación.
    """
    extension = os.path.splitext(upload_file.filename)[1].lower()
    temp_name = f"{uuid.uuid4().hex}{extension}"
    temp_path = os.path.join(settings.TEMP_DIR, temp_name)
    
    content = await upload_file.read()
    
    if not validate_fn(content):
        raise ValueError(f"El archivo '{upload_file.filename}' no tiene un formato válido.")
    
    with open(temp_path, "wb") as buffer:
        buffer.write(content)
        
    return temp_path


def create_temp_output_path(extension: str = ".pdf") -> str:
    """Genera una ruta aleatoria para el archivo de salida en el directorio temporal."""
    temp_name = f"output_{uuid.uuid4().hex}{extension}"
    return os.path.join(settings.TEMP_DIR, temp_name)


def cleanup_files(file_paths: list[str]):
    """Elimina una lista de archivos para liberar espacio."""
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Error deleting file {path}: {e}")
