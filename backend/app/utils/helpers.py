import os
import time
from app.core.logging import logger


def remove_file(path: str) -> None:
    """
    Elimina un archivo del disco de forma silenciosa.

    Diseñado para usarse como BackgroundTask en FileResponse,
    para limpiar el archivo de salida después de enviarlo al cliente.

    Args:
        path: Ruta absoluta del archivo a eliminar.
    """
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception as e:
        logger.warning("No se pudo eliminar archivo temporal %s: %s", path, e)


def cleanup_expired_temp_files(temp_dir: str, max_age_seconds: int = 3600) -> int:
    """
    Elimina archivos en temp_dir cuya antigüedad supere max_age_seconds.

    Returns:
        Cantidad de archivos eliminados.
    """
    removed = 0
    try:
        os.makedirs(temp_dir, exist_ok=True)
        now = time.time()
        for filename in os.listdir(temp_dir):
            filepath = os.path.join(temp_dir, filename)
            if os.path.isfile(filepath):
                file_age = now - os.path.getmtime(filepath)
                if file_age > max_age_seconds:
                    os.remove(filepath)
                    removed += 1
    except Exception as e:
        logger.warning("Error durante limpieza de temp_files en %s: %s", temp_dir, e)
    return removed
