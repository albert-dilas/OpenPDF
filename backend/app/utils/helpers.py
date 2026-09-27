import os


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
    except Exception:
        pass
