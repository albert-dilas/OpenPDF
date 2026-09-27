import os
from pathlib import Path

class Settings:
    PROJECT_NAME: str = "OpenPDF"
    API_V1_STR: str = "/api/v1"
    
    # Directorio temporal para procesar PDFs antes de descargarlos
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    TEMP_DIR: str = os.path.join(BASE_DIR, "temp_files")

    # Crear el directorio temporal si no existe
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR)

settings = Settings()
