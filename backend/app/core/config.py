import os
from pathlib import Path
from typing import List


def _default_user_data_dir() -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        return Path(local_app_data) / "OpenPDF"
    return Path.home() / ".config" / "openpdf"


class Settings:
    PROJECT_NAME: str = "OpenPDF"
    VERSION: str = "2.2.0"
    API_V1_STR: str = "/api/v1"

    # Directorio temporal para procesar PDFs antes de descargarlos
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    TEMP_DIR: str = os.path.join(BASE_DIR, "temp_files")

    # Directorio persistente de configuracion y datos del usuario (%LOCALAPPDATA%\OpenPDF)
    USER_DATA_DIR: Path = _default_user_data_dir()
    USER_CONFIG_PATH: str = os.environ.get(
        "OPENPDF_CONFIG_PATH", str(USER_DATA_DIR / "config.json")
    )
    USER_TESSDATA_DIR: str = os.environ.get(
        "OPENPDF_TESSDATA_DIR", str(USER_DATA_DIR / "tessdata")
    )

    # Limites de archivos (app de escritorio - limites generosos)
    MAX_FILE_SIZE_MB: int = 500
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024  # 500 MB por archivo
    MAX_TOTAL_MERGE_SIZE_BYTES: int = 2 * 1024 * 1024 * 1024   # 2 GB para merge multi-archivo

    # CORS: solo localhost (app de escritorio)
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    def __init__(self) -> None:
        os.makedirs(self.TEMP_DIR, exist_ok=True)


settings = Settings()
