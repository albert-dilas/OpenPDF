from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from pydantic import BaseModel, Field, field_validator

from app.services.desktop_service import (
    active_process_registry,
    check_disk_quota,
    get_desktop_config,
    get_storage_summary,
    open_local_folder,
    purge_temp_storage,
    save_output_file,
    self_updater,
    update_desktop_config,
)
from app.services.system_service import SystemService, get_system_service

router = APIRouter()


class ConfigureModuleRequest(BaseModel):
    module: str
    path: str = ""


class ModuleActionRequest(BaseModel):
    module: str


class FeedbackRequest(BaseModel):
    category: str = Field(default="opinion")
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=5, max_length=10000)
    email: str = Field(default="", max_length=150)
    system_info: dict = Field(default_factory=dict)

    @field_validator("title", "description", mode="before")
    @classmethod
    def strip_text(cls, v: str) -> str:
        if isinstance(v, str):
            stripped = v.strip()
            if not stripped:
                raise ValueError("El campo no puede estar vacío ni contener solo espacios.")
            return stripped
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        allowed = {"feature", "bug", "opinion", "general"}
        clean = (v or "opinion").strip().lower()
        if clean not in allowed:
            raise ValueError(f"Categoría inválida. Valores permitidos: {', '.join(allowed)}")
        return clean


class DesktopConfigUpdateRequest(BaseModel):
    keep_in_background: Optional[bool] = None
    start_with_windows: Optional[bool] = None
    start_minimized: Optional[bool] = None
    context_menu_enabled: Optional[bool] = None
    update_mode: Optional[Literal["notify", "auto", "manual"]] = None
    save_mode: Optional[Literal["ask", "fixed_folder"]] = None
    default_output_dir: Optional[str] = Field(default=None, min_length=1, max_length=500)
    clean_temp_on_exit: Optional[bool] = None
    smart_zip_downloads: Optional[bool] = None

    @field_validator("default_output_dir", mode="before")
    @classmethod
    def strip_output_dir(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            stripped = v.strip()
            if not stripped:
                raise ValueError("La carpeta de salida no puede estar vacía.")
            return stripped
        return v


class CheckQuotaRequest(BaseModel):
    required_bytes: int = Field(default=0, ge=0)


class PurgeTempRequest(BaseModel):
    include_session: bool = False


class OpenFolderRequest(BaseModel):
    target: Literal["data", "output"] = "output"


class UpdateDownloadRequest(BaseModel):
    download_url: str = Field(..., min_length=8)
    target_version: str = Field(..., min_length=1, max_length=64)
    asset_name: Optional[str] = None
    checksums_url: Optional[str] = None
    expected_sha256: Optional[str] = None


class OpenWindowRequest(BaseModel):
    route: str = "/"
    file_path: Optional[str] = None


@router.get("/status")
async def system_status_endpoint(
    system_service: SystemService = Depends(get_system_service),
):
    """Retorna version, capacidades de los 6 motores, idiomas OCR, limite de tamano, estado de modulos, desktop config y metricas del sistema."""
    return system_service.get_status()


@router.get("/modules")
async def system_modules_endpoint(
    system_service: SystemService = Depends(get_system_service),
):
    """Retorna el estado detallado de los 6 motores opcionales de Tornio."""
    return system_service.get_status()


@router.post("/detect-modules")
async def detect_modules_endpoint(
    system_service: SystemService = Depends(get_system_service),
):
    """Limpia la cache de binarios, re-escanea el sistema y sincroniza idiomas OCR."""
    return system_service.detect_modules()


@router.post("/configure-module")
async def configure_module_endpoint(
    req: ConfigureModuleRequest,
    system_service: SystemService = Depends(get_system_service),
):
    """Configura o restablece la ruta personalizada del ejecutable de un modulo."""
    return system_service.configure_module(req.module, req.path)


@router.post("/pick-module-binary")
async def pick_module_binary_endpoint(
    req: ModuleActionRequest,
    system_service: SystemService = Depends(get_system_service),
):
    """Abre un selector de archivos nativo de Windows para vincular el ejecutable de un modulo."""
    return system_service.pick_module_binary(req.module)


@router.post("/install-module")
async def install_module_endpoint(
    req: ModuleActionRequest,
    system_service: SystemService = Depends(get_system_service),
):
    """Inicia la instalacion desatendida en segundo plano de un motor o paquete de idioma."""
    return system_service.install_module(req.module)


@router.get("/updates")
async def system_updates_endpoint(
    force: bool = False,
    system_service: SystemService = Depends(get_system_service),
):
    """Comprueba actualizaciones en GitHub Releases con timeout corto y fallback offline silencioso."""
    return await system_service.check_updates(force=force)


@router.get("/update-status")
async def system_update_status_endpoint():
    """Retorna el estado en tiempo real de descarga y verificacion SHA-256 del auto-actualizador."""
    return self_updater.get_status()


@router.post("/update-download")
async def system_update_download_endpoint(req: UpdateDownloadRequest):
    """Descarga el paquete oficial desde GitHub Releases y lo verifica contra SHA256SUMS.txt."""
    return self_updater.start_download(
        download_url=req.download_url,
        target_version=req.target_version,
        asset_name=req.asset_name,
        checksums_url=req.checksums_url,
        expected_sha256=req.expected_sha256,
    )


@router.post("/update-cancel")
async def system_update_cancel_endpoint():
    """Cancela inmediatamente la descarga de actualizacion en curso."""
    return self_updater.cancel_download()


@router.post("/update-apply")
async def system_update_apply_endpoint():
    """Aplica la actualizacion verificada (instalador silencioso o reemplazo atomico portable)."""
    return self_updater.apply_update()


@router.get("/desktop-config")
async def get_desktop_config_endpoint():
    """Retorna las preferencias de ejecucion en escritorio, guardado e integracion con el sistema."""
    return get_desktop_config()


@router.put("/desktop-config")
async def update_desktop_config_endpoint(
    req: DesktopConfigUpdateRequest,
    request: Request,
):
    """Actualiza las preferencias desktop en config.json y sincroniza autostart/menu contextual."""
    patch = req.model_dump(exclude_none=True)
    updated = update_desktop_config(patch)

    sync_tray_fn = getattr(request.app.state, "sync_tray_fn", None)
    if callable(sync_tray_fn):
        sync_tray_fn(bool(updated.get("keep_in_background")))

    return updated


@router.get("/storage")
async def get_storage_summary_endpoint():
    """Retorna espacio libre en disco y consumo local de temporales, sesion, modelos y recetas."""
    return get_storage_summary()


@router.post("/storage/check-quota")
async def check_storage_quota_endpoint(req: CheckQuotaRequest):
    """Evalua antes de procesar si hay espacio libre recomendado para completar el trabajo."""
    return check_disk_quota(req.required_bytes)


@router.post("/storage/purge-temp")
async def purge_storage_temp_endpoint(req: PurgeTempRequest):
    """Elimina archivos temporales y opcionalmente limpia archivos de sesion."""
    return purge_temp_storage(include_session=req.include_session)


@router.post("/storage/open-folder")
async def open_storage_folder_endpoint(req: OpenFolderRequest):
    """Abre en el explorador nativo la carpeta de datos locales o de salida predeterminada."""
    return open_local_folder(req.target)


@router.post("/storage/save-output")
async def save_output_fixed_folder_endpoint(
    file: UploadFile = File(...),
    filename: str = Form(""),
):
    """Guarda un archivo resultado directamente en la carpeta fija configurada (con auto-numeracion)."""
    content = await file.read()
    chosen_name = filename.strip() or (file.filename or "resultado_tornio")
    return save_output_file(chosen_name, content)


@router.post("/cancel-request/{request_id}")
async def cancel_active_request_endpoint(request_id: str):
    """Termina inmediatamente cualquier subproceso sincrono asociado a X-Request-Id."""
    return active_process_registry.cancel(request_id)


@router.post("/open-window")
async def open_window_endpoint(req: OpenWindowRequest, request: Request):
    """Trae al frente o abre la ventana de Tornio e ingiere un archivo opcional en la sesion."""
    asset_id = None
    if req.file_path:
        ingest_fn = getattr(request.app.state, "ingest_cli_file_fn", None)
        if callable(ingest_fn):
            asset_id = ingest_fn(req.file_path)

    target_route = req.route or ("/workspace" if asset_id else "/")
    open_fn = getattr(request.app.state, "open_window_fn", None)
    if callable(open_fn):
        open_fn(target_route)

    return {"opened": True, "route": target_route, "asset_id": asset_id}


@router.post("/shutdown")
async def shutdown_desktop_endpoint(request: Request):
    """Detiene limpiamente la bandeja del sistema y el servidor local cuando corre en modo desktop."""
    shutdown_fn = getattr(request.app.state, "shutdown_fn", None)
    if callable(shutdown_fn):
        shutdown_fn()
        return {"shutting_down": True}
    return {"shutting_down": False}


@router.post("/feedback")
async def system_feedback_endpoint(
    req: FeedbackRequest,
    system_service: SystemService = Depends(get_system_service),
):
    """Registra una opinion, sugerencia o reporte de error en el entorno local."""
    return system_service.save_feedback(req.model_dump())
