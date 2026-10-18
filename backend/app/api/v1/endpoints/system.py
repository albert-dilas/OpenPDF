from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator
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


@router.get("/status")
async def system_status_endpoint(
    system_service: SystemService = Depends(get_system_service),
):
    """Retorna version, capacidades disponibles (OCR, Word a PDF), idiomas OCR, limite de tamano y estado de modulos."""
    return system_service.get_status()


@router.get("/modules")
async def system_modules_endpoint(
    system_service: SystemService = Depends(get_system_service),
):
    """Retorna el estado detallado de los motores externos (OCR y Word a PDF)."""
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


@router.post("/feedback")
async def system_feedback_endpoint(
    req: FeedbackRequest,
    system_service: SystemService = Depends(get_system_service),
):
    """Registra una opinion, sugerencia o reporte de error en el entorno local."""
    return system_service.save_feedback(req.model_dump())

