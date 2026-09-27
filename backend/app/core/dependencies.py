from fastapi import UploadFile
from typing import List, AsyncGenerator
import os
import uuid
import shutil
from app.core.config import settings

class TempFileManager:
    """Clase para manejar archivos temporales y asegurar su eliminación al finalizar la request."""
    def __init__(self):
        self._tracked_files: List[str] = []

    def track(self, path: str):
        if path not in self._tracked_files:
            self._tracked_files.append(path)

    async def save_upload_file(self, upload_file: UploadFile) -> str:
        extension = os.path.splitext(upload_file.filename)[1].lower()
        temp_name = f"{uuid.uuid4().hex}{extension}"
        temp_path = os.path.join(settings.TEMP_DIR, temp_name)
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
        self.track(temp_path)
        return temp_path

    def create_output_path(self, extension: str = ".pdf") -> str:
        temp_name = f"output_{uuid.uuid4().hex}{extension}"
        temp_path = os.path.join(settings.TEMP_DIR, temp_name)
        self.track(temp_path)
        return temp_path

    def untrack(self, path: str):
        if path in self._tracked_files:
            self._tracked_files.remove(path)

    def cleanup(self):
        for path in self._tracked_files:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                print(f"Error limpiando el archivo temporal {path}: {e}")

async def get_temp_file_manager() -> AsyncGenerator[TempFileManager, None]:
    """Dependency para inyectar TempFileManager en los endpoints. 
    Se asegura de limpiar los archivos incluso si ocurre una excepción."""
    manager = TempFileManager()
    try:
        yield manager
    finally:
        manager.cleanup()
