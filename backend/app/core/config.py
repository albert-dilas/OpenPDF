import os
from pathlib import Path
from typing import List

class Settings:
    PROJECT_NAME: str = "OpenPDF"
    API_V1_STR: str = "/api/v1"

    # Directorio temporal para procesar PDFs antes de descargarlos
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    TEMP_DIR: str = os.path.join(BASE_DIR, "temp_files")

    # Límites de archivos (app de escritorio — límites generosos)
    MAX_FILE_SIZE_MB: int = 500
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024  # 500 MB por archivo
    MAX_TOTAL_MERGE_SIZE_BYTES: int = 2 * 1024 * 1024 * 1024   # 2 GB para merge multi-archivo

    # CORS: solo localhost (app de escritorio)
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",   # Next.js dev server
        "http://127.0.0.1:3000",
    ]

    # Crear el directorio temporal si no existe
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR)

settings = Settings()
