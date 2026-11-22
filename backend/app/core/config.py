import os
import shutil
from pathlib import Path
from typing import List, Optional


def _default_user_data_dir() -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        return Path(local_app_data) / "Tornio"
    return Path.home() / ".config" / "tornio"


def _legacy_openpdf_data_dir() -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        return Path(local_app_data) / "OpenPDF"
    return Path.home() / ".config" / "openpdf"


def migrate_legacy_openpdf_data(
    target_dir: Optional[Path] = None,
    legacy_dir: Optional[Path] = None,
) -> bool:
    """
    Migracion silenciosa unica desde el antiguo directorio de datos de OpenPDF hacia Tornio.
    Si Tornio config.json no existe y el config.json de OpenPDF existe, copia config.json
    y tessdata/*.traineddata sin sobrescribir archivos existentes en Tornio.
    """
    try:
        dst_dir = target_dir or _default_user_data_dir()
        src_dir = legacy_dir or _legacy_openpdf_data_dir()
        if dst_dir.resolve() == src_dir.resolve():
            return False

        src_cfg = src_dir / "config.json"
        dst_cfg = dst_dir / "config.json"
        if dst_cfg.exists() or not src_cfg.is_file():
            return False

        dst_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_cfg, dst_cfg)

        src_tessdata = src_dir / "tessdata"
        if src_tessdata.is_dir():
            dst_tessdata = dst_dir / "tessdata"
            dst_tessdata.mkdir(parents=True, exist_ok=True)
            for model_file in src_tessdata.glob("*.traineddata"):
                target_model = dst_tessdata / model_file.name
                if not target_model.exists():
                    shutil.copy2(model_file, target_model)
        return True
    except Exception:
        return False


class Settings:
    PROJECT_NAME: str = "Tornio"
    VERSION: str = "3.0.0"
    API_V1_STR: str = "/api/v1"

    # Directorio temporal para procesar archivos antes de descargarlos
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    TEMP_DIR: str = os.path.join(BASE_DIR, "temp_files")

    # Directorio persistente de configuracion y datos del usuario (%LOCALAPPDATA%\Tornio)
    USER_DATA_DIR: Path = _default_user_data_dir()
    USER_CONFIG_PATH: str = (
        os.environ.get("TORNIO_CONFIG_PATH", "").strip()
        or os.environ.get("OPENPDF_CONFIG_PATH", "").strip()
        or str(USER_DATA_DIR / "config.json")
    )
    USER_TESSDATA_DIR: str = (
        os.environ.get("TORNIO_TESSDATA_DIR", "").strip()
        or os.environ.get("OPENPDF_TESSDATA_DIR", "").strip()
        or str(USER_DATA_DIR / "tessdata")
    )
    USER_MODELS_DIR: Path = USER_DATA_DIR / "models"
    USER_BIN_DIR: Path = USER_DATA_DIR / "bin"
    USER_RECIPES_DIR: Path = USER_DATA_DIR / "recipes"
    USER_MODULES_DIR: Path = USER_DATA_DIR / "modules"
    SESSION_ASSETS_DIR: Path = Path(TEMP_DIR) / "session_assets"

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
        self.SESSION_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
        has_custom_cfg = bool(
            os.environ.get("TORNIO_CONFIG_PATH", "").strip()
            or os.environ.get("OPENPDF_CONFIG_PATH", "").strip()
        )
        if not has_custom_cfg:
            migrate_legacy_openpdf_data(target_dir=self.USER_DATA_DIR)


settings = Settings()
