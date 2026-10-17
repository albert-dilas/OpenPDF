from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional
import asyncio
import os
import socket
import sys
import python_multipart  # noqa: F401 - Requerido por PyInstaller para empaquetar python-multipart

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.exceptions import (
    OpenPDFBaseException,
    global_openpdf_exception_handler,
    global_unhandled_exception_handler,
)
from app.core.logging import logger
from app.utils.helpers import cleanup_expired_temp_files

TEMP_FILE_MAX_AGE_SECONDS = 3600  # 1 hora


def _default_frontend_dist() -> Path:
    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        candidate = Path(meipass) / "frontend" / "out"
        if candidate.exists():
            return candidate
    return settings.BASE_DIR.parent / "frontend" / "out"


FRONTEND_DIST_DIR: Path = _default_frontend_dist()


async def cleanup_old_temp_files():
    """Tarea periódica que elimina archivos temporales huérfanos (más de 1 hora de antigüedad)."""
    while True:
        await asyncio.sleep(TEMP_FILE_MAX_AGE_SECONDS)
        cleanup_expired_temp_files(settings.TEMP_DIR, TEMP_FILE_MAX_AGE_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manejo del ciclo de vida de la aplicación (startup y shutdown)."""
    os.makedirs(settings.TEMP_DIR, exist_ok=True)
    cleanup_expired_temp_files(settings.TEMP_DIR, TEMP_FILE_MAX_AGE_SECONDS)

    cleanup_task = asyncio.create_task(cleanup_old_temp_files())

    yield

    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for OpenPDF",
    version=settings.VERSION,
    lifespan=lifespan,
)

# Exception handlers
app.add_exception_handler(OpenPDFBaseException, global_openpdf_exception_handler)
app.add_exception_handler(Exception, global_unhandled_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    expose_headers=[
        "X-Original-Size",
        "X-Compressed-Size",
        "X-Compression-Ratio",
        "Content-Disposition",
    ],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check():
    """Endpoint de salud para verificar que el servidor está funcionando."""
    try:
        os.makedirs(settings.TEMP_DIR, exist_ok=True)
        temp_files_count = len([
            f for f in os.listdir(settings.TEMP_DIR)
            if os.path.isfile(os.path.join(settings.TEMP_DIR, f))
        ])
    except Exception:
        temp_files_count = -1

    return {
        "status": "ok",
        "temp_files": temp_files_count,
    }


def resolve_frontend_path(frontend_root: Path, full_path: str) -> Optional[Path]:
    """
    Resuelve de forma segura una ruta dentro de frontend_root usando Path.resolve().
    Rechaza cualquier intento de path traversal fuera de frontend_root retornando None.
    """
    try:
        root = frontend_root.resolve()
    except OSError:
        return None

    if not root.is_dir():
        return None

    normalized_parts = full_path.replace("\\", "/").split("/")
    if ".." in normalized_parts:
        return None

    rel = full_path.lstrip("/\\")
    try:
        candidate = (root / rel).resolve()
        candidate.relative_to(root)
    except (ValueError, OSError):
        return None

    if candidate.is_file():
        return candidate

    if rel:
        try:
            html_candidate = Path(f"{candidate}.html").resolve()
            html_candidate.relative_to(root)
            if html_candidate.is_file():
                return html_candidate
        except (ValueError, OSError):
            return None

    index_file = (root / "index.html").resolve()
    try:
        index_file.relative_to(root)
        if index_file.is_file():
            return index_file
    except (ValueError, OSError):
        return None

    return None


if FRONTEND_DIST_DIR.exists():
    next_dist = FRONTEND_DIST_DIR / "_next"
    if next_dist.exists():
        app.mount("/_next", StaticFiles(directory=str(next_dist)), name="next_assets")


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    target = resolve_frontend_path(FRONTEND_DIST_DIR, full_path)
    if target is None:
        raise HTTPException(status_code=404, detail="Not Found")
    return FileResponse(str(target))


def is_port_free(host: str, port: int) -> bool:
    """Verifica si un puerto TCP local está disponible."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            try:
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            except OSError:
                pass
        try:
            sock.bind((host, port))
            return True
        except OSError:
            return False


def select_port(host: str = "127.0.0.1") -> int:
    """Elige el puerto libre: OPENPDF_PORT si se define, o el primero libre entre 8000 y 8010."""
    env_port = os.environ.get("OPENPDF_PORT", "").strip()
    if env_port:
        try:
            port = int(env_port)
            if is_port_free(host, port):
                return port
            logger.warning("El puerto configurado en OPENPDF_PORT (%d) está ocupado; buscando alternativa.", port)
        except ValueError:
            logger.warning("Valor inválido en OPENPDF_PORT: %s", env_port)

    for port in range(8000, 8011):
        if is_port_free(host, port):
            return port

    raise RuntimeError("No se encontró ningún puerto libre en el rango 8000-8010.")


if __name__ == "__main__":
    import threading
    import time
    import uvicorn
    import webbrowser

    # PyInstaller windowless mode (console=False) sets sys.stdout and sys.stderr to None.
    # Uvicorn needs them to have an .isatty() method.
    if sys.stdout is None:
        sys.stdout = open(os.devnull, "w")
    if sys.stderr is None:
        sys.stderr = open(os.devnull, "w")

    host = "127.0.0.1"
    chosen_port = select_port(host)
    app_url = f"http://{host}:{chosen_port}"
    logger.info("Iniciando OpenPDF v%s en %s", settings.VERSION, app_url)

    def open_browser():
        time.sleep(1.5)
        webbrowser.open(app_url)

    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run(app, host=host, port=chosen_port, reload=False)
