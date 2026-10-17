from fastapi import UploadFile
from typing import List, AsyncGenerator, Optional, Callable
import os
import uuid
from app.core.config import settings
from app.core.exceptions import InvalidFormatError, BusinessRuleError
from app.core.logging import logger

CHUNK_SIZE = 1024 * 1024  # 1 MiB


class TempFileManager:
    """Gestiona archivos temporales, validación de contenido en streaming y limpieza garantizada."""

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
        Guarda un archivo subido en el directorio temporal leyendo en streaming por chunks (1 MiB).

        Args:
            upload_file: Archivo recibido por FastAPI.
            validate_fn: Función opcional que recibe el primer chunk/cabecera de bytes del archivo
                         y retorna True si el formato es válido (magic bytes).

        Raises:
            BusinessRuleError: Si el archivo supera el límite de tamaño (aborta y borra el parcial).
            InvalidFormatError: Si validate_fn retorna False en el primer chunk.
        """
        os.makedirs(settings.TEMP_DIR, exist_ok=True)
        filename = upload_file.filename or "upload"
        extension = os.path.splitext(filename)[1].lower()
        temp_name = f"{uuid.uuid4().hex}{extension}"
        temp_path = os.path.join(settings.TEMP_DIR, temp_name)

        total_bytes = 0
        first_chunk = True

        try:
            with open(temp_path, "wb") as buffer:
                while True:
                    chunk = await upload_file.read(CHUNK_SIZE)
                    if first_chunk:
                        first_chunk = False
                        if validate_fn is not None and not validate_fn(chunk):
                            raise InvalidFormatError(
                                f"El archivo '{upload_file.filename}' no tiene un formato válido. "
                                f"Asegúrate de subir el tipo de archivo correcto."
                            )
                    if not chunk:
                        break

                    total_bytes += len(chunk)
                    if total_bytes > settings.MAX_FILE_SIZE_BYTES:
                        raise BusinessRuleError(
                            f"El archivo '{upload_file.filename}' supera el límite máximo de "
                            f"{settings.MAX_FILE_SIZE_MB} MB."
                        )
                    buffer.write(chunk)
        except Exception:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except OSError as e:
                    logger.warning("No se pudo eliminar archivo parcial %s: %s", temp_path, e)
            raise

        self.track(temp_path)
        return temp_path

    def create_output_path(self, extension: str = ".pdf") -> str:
        """Genera una ruta única para el archivo de salida."""
        os.makedirs(settings.TEMP_DIR, exist_ok=True)
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
                logger.warning("Error limpiando %s: %s", path, e)


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
