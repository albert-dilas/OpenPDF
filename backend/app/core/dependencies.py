from fastapi import UploadFile
from typing import List, AsyncGenerator, Optional, Callable
import os
import uuid
import shutil
from app.core.config import settings
from app.core.exceptions import InvalidFormatError, BusinessRuleError


class TempFileManager:
    """Gestiona archivos temporales, validación de contenido y limpieza garantizada."""

    def __init__(self):
        self._tracked_files: List[str] = []

    def track(self, path: str) -> None:
        if path not in self._tracked_files:
            self._tracked_files.append(path)

    async def save_upload_file(
        self,
        upload_file: UploadFile,
        validate_fn: Optional[Callable[[bytes], bool]] = None,
    ) -> str:
        """
        Guarda un archivo subido en el directorio temporal.

        Args:
            upload_file: Archivo recibido por FastAPI.
            validate_fn: Función opcional que recibe los bytes del archivo y
                         retorna True si el formato es válido. Se usa para
                         validar por magic bytes en lugar de confiar en la extensión.

        Raises:
            BusinessRuleError: Si el archivo supera el límite de tamaño.
            InvalidFormatError: Si validate_fn retorna False.
        """
        # Leer todo el contenido para poder validarlo
        content = await upload_file.read()

        # 1. Validar tamaño
        if len(content) > settings.MAX_FILE_SIZE_BYTES:
            raise BusinessRuleError(
                f"El archivo '{upload_file.filename}' supera el límite máximo de "
                f"{settings.MAX_FILE_SIZE_MB} MB ({settings.MAX_FILE_SIZE_MB * 1024 * 1024 / 1024 / 1024:.0f} GB)."
            )

        # 2. Validar formato por magic bytes si se proporciona función
        if validate_fn is not None and not validate_fn(content):
            raise InvalidFormatError(
                f"El archivo '{upload_file.filename}' no tiene un formato válido. "
                f"Asegúrate de subir el tipo de archivo correcto."
            )

        # 3. Guardar en disco
        filename = upload_file.filename or "upload"
        extension = os.path.splitext(filename)[1].lower()
        temp_name = f"{uuid.uuid4().hex}{extension}"
        temp_path = os.path.join(settings.TEMP_DIR, temp_name)

        with open(temp_path, "wb") as buffer:
            buffer.write(content)

        self.track(temp_path)
        return temp_path

    def create_output_path(self, extension: str = ".pdf") -> str:
        """Genera una ruta única para el archivo de salida."""
        temp_name = f"output_{uuid.uuid4().hex}{extension}"
        temp_path = os.path.join(settings.TEMP_DIR, temp_name)
        self.track(temp_path)
        return temp_path

    def untrack(self, path: str) -> None:
        """Quita un path del tracking para que no sea borrado por cleanup()."""
        if path in self._tracked_files:
            self._tracked_files.remove(path)

    def cleanup(self) -> None:
        """Elimina todos los archivos tracked. Llamado automáticamente al finalizar la request."""
        for path in self._tracked_files:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                print(f"[TempFileManager] Error limpiando {path}: {e}")


async def get_temp_file_manager() -> AsyncGenerator[TempFileManager, None]:
    """
    FastAPI Dependency que inyecta un TempFileManager por request.
    Garantiza limpieza de archivos temporales incluso si ocurre una excepción.
    """
    manager = TempFileManager()
    try:
        yield manager
    finally:
        manager.cleanup()
