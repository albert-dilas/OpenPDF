from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional
import asyncio
import json
import os
import shutil
import socket
import subprocess
import sys
import threading
import time
import uuid
import python_multipart  # noqa: F401 - Requerido por PyInstaller para empaquetar python-multipart

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.api import api_router
from app.core.config import migrate_legacy_openpdf_data, settings
from app.core.exceptions import (
    OpenPDFBaseException,
    global_openpdf_exception_handler,
    global_unhandled_exception_handler,
)
from app.core.jobs import job_manager
from app.core.logging import logger
from app.core.tray import WindowsTrayIcon
from app.services.desktop_service import (
    current_request_id,
    get_desktop_config,
    get_effective_data_dir,
    purge_temp_storage,
    self_updater,
)
from app.services.workspace_inspector import inspect_file_sync
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


class RequestIdContextMiddleware:
    """Middleware ASGI puro para propagar X-Request-Id sin interferir con streams SSE."""

    def __init__(self, asgi_app) -> None:
        self.app = asgi_app

    async def __call__(self, scope, receive, send) -> None:
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return

        req_id: Optional[str] = None
        for key, value in scope.get("headers") or ():
            if key.lower() == b"x-request-id":
                parsed = value.decode("latin-1").strip()
                if parsed:
                    req_id = parsed
                break

        if not req_id:
            await self.app(scope, receive, send)
            return

        token = current_request_id.set(req_id)
        try:
            await self.app(scope, receive, send)
        finally:
            current_request_id.reset(token)


def ingest_cli_file_to_session(raw_file_path: str) -> Optional[str]:
    """Copia un archivo local recibido por CLI ('Abrir con Tornio') y lo registra en sesion."""
    if not raw_file_path:
        return None
    src = Path(raw_file_path).expanduser()
    if not src.is_file():
        return None

    asset_id = uuid.uuid4().hex[:16]
    ext = src.suffix.lower()
    settings.SESSION_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    dest = settings.SESSION_ASSETS_DIR / f"{asset_id}{ext}"
    try:
        shutil.copy2(str(src), str(dest))
        record = inspect_file_sync(
            file_path=dest,
            filename=src.name,
            asset_id=asset_id,
            source_job_id=None,
            manager=job_manager,
        )
        return record.id
    except Exception as exc:
        logger.warning("No se pudo cargar archivo CLI en sesion (%s): %s", raw_file_path, exc)
        if dest.exists():
            try:
                dest.unlink()
            except OSError:
                pass
        return None


async def cleanup_old_temp_files():
    """Tarea periódica que elimina archivos temporales huérfanos (más de 1 hora de antigüedad)."""
    while True:
        await asyncio.sleep(TEMP_FILE_MAX_AGE_SECONDS)
        cleanup_expired_temp_files(settings.TEMP_DIR, TEMP_FILE_MAX_AGE_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manejo del ciclo de vida de la aplicacion (startup y shutdown)."""
    os.makedirs(settings.TEMP_DIR, exist_ok=True)
    settings.SESSION_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    if not (
        os.environ.get("TORNIO_CONFIG_PATH", "").strip()
        or os.environ.get("OPENPDF_CONFIG_PATH", "").strip()
    ):
        migrate_legacy_openpdf_data(target_dir=settings.USER_DATA_DIR)
    cleanup_expired_temp_files(settings.TEMP_DIR, TEMP_FILE_MAX_AGE_SECONDS)

    cleanup_task = asyncio.create_task(cleanup_old_temp_files())

    try:
        yield
    finally:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass

        keep_temp = os.environ.get("TORNIO_KEEP_TEMP_ON_SHUTDOWN", "").strip().lower() in (
            "1",
            "true",
            "yes",
        )
        if not keep_temp and get_desktop_config().get("clean_temp_on_exit", True):
            try:
                purge_temp_storage(include_session=True)
            except Exception as exc:
                logger.warning("Error limpiando temporales al cerrar Tornio: %s", exc)


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Tornio",
    version=settings.VERSION,
    lifespan=lifespan,
)
app.state.ingest_cli_file_fn = ingest_cli_file_to_session

# Exception handlers
app.add_exception_handler(OpenPDFBaseException, global_openpdf_exception_handler)
app.add_exception_handler(Exception, global_unhandled_exception_handler)

app.add_middleware(RequestIdContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
    expose_headers=[
        "X-Original-Size",
        "X-Compressed-Size",
        "X-Compression-Ratio",
        "X-Redacted-Count",
        "X-QR-Verified",
        "X-Translated-Pages",
        "X-Job-Id",
        "X-Asset-Id",
        "X-Processing-Ms",
        "X-Output-Size",
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
    """Elige el puerto libre: TORNIO_PORT / OPENPDF_PORT si se define, o el primero libre entre 8000 y 8010."""
    env_port = (
        os.environ.get("TORNIO_PORT", "").strip()
        or os.environ.get("OPENPDF_PORT", "").strip()
    )
    if env_port:
        try:
            port = int(env_port)
            if is_port_free(host, port):
                return port
            logger.warning("El puerto configurado (%d) esta ocupado; buscando alternativa.", port)
        except ValueError:
            logger.warning("Valor invalido en puerto configurado: %s", env_port)

    for port in range(8000, 8011):
        if is_port_free(host, port):
            return port

    raise RuntimeError("No se encontro ningun puerto libre en el rango 8000-8010.")


def _find_chromium_app_browser() -> Optional[str]:
    candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        candidates.append(os.path.join(local_app_data, "Microsoft", "Edge", "Application", "msedge.exe"))
        candidates.append(os.path.join(local_app_data, "Google", "Chrome", "Application", "chrome.exe"))

    for path in candidates:
        if os.path.isfile(path):
            return path

    for bin_name in ("msedge", "chrome", "google-chrome", "chromium"):
        found = shutil.which(bin_name)
        if found and os.path.isfile(found):
            return found

    return None


def _wait_for_server_ready(host: str, port: int, timeout_sec: float = 8.0) -> bool:
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            with socket.create_connection((host, port), timeout=0.25):
                return True
        except OSError:
            time.sleep(0.1)
    return False


def launch_desktop_window(
    app_url: str,
    host: str,
    port: int,
    route: str = "/",
    on_window_closed=None,
) -> None:
    """Abre la ventana dedicada (--app con perfil aislado) y notifica si el usuario la cierra."""
    import webbrowser

    no_browser = (
        os.environ.get("TORNIO_NO_BROWSER", "").strip()
        or os.environ.get("OPENPDF_NO_BROWSER", "").strip()
    ).lower()
    if no_browser in ("1", "true", "yes"):
        return

    _wait_for_server_ready(host, port, timeout_sec=8.0)

    clean_route = route if route.startswith("/") else f"/{route}"
    target_url = f"{app_url.rstrip('/')}{clean_route}"

    browser_bin = _find_chromium_app_browser()
    if browser_bin:
        profile_dir = get_effective_data_dir() / "browser_profile"
        profile_dir.mkdir(parents=True, exist_ok=True)
        try:
            started_at = time.monotonic()
            proc = subprocess.Popen(
                [
                    browser_bin,
                    f"--app={target_url}",
                    f"--user-data-dir={profile_dir}",
                    "--window-size=1400,900",
                    "--new-window",
                    "--no-first-run",
                    "--no-default-browser-check",
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            if callable(on_window_closed):
                proc.wait()
                elapsed = time.monotonic() - started_at
                # Evitar falso apagado si el launcher del navegador delego a otra instancia en < 2s
                if elapsed >= 2.0:
                    on_window_closed()
            return
        except OSError:
            pass

    webbrowser.open(target_url)


def _try_wake_existing_instance(open_file_path: Optional[str]) -> bool:
    """Detecta si Tornio ya esta corriendo; si responde /health, reenvia ventana/archivo y sale."""
    import httpx

    lock_file = get_effective_data_dir() / "instance.json"
    if not lock_file.is_file():
        return False

    try:
        info = json.loads(lock_file.read_text(encoding="utf-8"))
        existing_url = str(info.get("url") or "").strip()
        if not existing_url:
            return False

        health = httpx.get(f"{existing_url}/health", timeout=0.8)
        if health.status_code != 200:
            return False

        route = "/workspace" if open_file_path else "/"
        httpx.post(
            f"{existing_url}/api/v1/system/open-window",
            json={"route": route, "file_path": open_file_path},
            timeout=2.5,
        )
        return True
    except Exception:
        return False


if __name__ == "__main__":
    import uvicorn

    # PyInstaller windowless mode (console=False) sets sys.stdout and sys.stderr to None.
    if sys.stdout is None:
        sys.stdout = open(os.devnull, "w")
    if sys.stderr is None:
        sys.stderr = open(os.devnull, "w")

    cli_args = sys.argv[1:]
    start_in_background = "--background" in cli_args
    open_file_arg: Optional[str] = None
    for arg in cli_args:
        if not arg.startswith("-") and os.path.isfile(arg):
            open_file_arg = str(Path(arg).resolve())
            break

    if _try_wake_existing_instance(open_file_arg):
        sys.exit(0)

    host = "127.0.0.1"
    chosen_port = select_port(host)
    app_url = f"http://{host}:{chosen_port}"
    logger.info("Iniciando Tornio v%s en %s", settings.VERSION, app_url)

    data_dir = get_effective_data_dir()
    data_dir.mkdir(parents=True, exist_ok=True)
    lock_file = data_dir / "instance.json"
    lock_file.write_text(
        json.dumps({"url": app_url, "port": chosen_port, "pid": os.getpid()}),
        encoding="utf-8",
    )

    server = uvicorn.Server(uvicorn.Config(app, host=host, port=chosen_port, reload=False))
    tray_holder: dict[str, Optional[WindowsTrayIcon]] = {"tray": None}

    def open_route_from_desktop(route: str = "/") -> None:
        threading.Thread(
            target=launch_desktop_window,
            args=(app_url, host, chosen_port, route, handle_window_closed),
            daemon=True,
        ).start()

    def shutdown_desktop_runtime() -> None:
        tray = tray_holder.get("tray")
        if tray is not None:
            tray.stop()
            tray_holder["tray"] = None
        server.should_exit = True

    def handle_window_closed() -> None:
        latest_cfg = get_desktop_config()
        if not latest_cfg.get("keep_in_background", False):
            shutdown_desktop_runtime()

    def sync_tray_runtime(keep_in_background: bool) -> None:
        existing_tray = tray_holder.get("tray")
        if keep_in_background:
            if existing_tray is None:
                tray = WindowsTrayIcon(
                    on_open_route=open_route_from_desktop,
                    on_exit=shutdown_desktop_runtime,
                )
                tray.start()
                tray_holder["tray"] = tray
        else:
            if existing_tray is not None:
                existing_tray.stop()
                tray_holder["tray"] = None

    app.state.server_url = app_url
    app.state.uvicorn_server = server
    app.state.open_window_fn = open_route_from_desktop
    app.state.shutdown_fn = shutdown_desktop_runtime
    app.state.sync_tray_fn = sync_tray_runtime
    self_updater.set_shutdown_hook(shutdown_desktop_runtime)

    initial_cfg = get_desktop_config()
    if initial_cfg.get("keep_in_background", False) or start_in_background:
        sync_tray_runtime(True)

    initial_route = "/"
    if open_file_arg:
        ingested = ingest_cli_file_to_session(open_file_arg)
        if ingested:
            initial_route = "/workspace"

    if not start_in_background or open_file_arg is not None:
        open_route_from_desktop(initial_route)

    try:
        server.run()
    finally:
        shutdown_desktop_runtime()
        try:
            lock_file.unlink(missing_ok=True)
        except OSError:
            pass
