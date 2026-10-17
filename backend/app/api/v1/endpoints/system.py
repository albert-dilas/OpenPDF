from fastapi import APIRouter, Depends
from app.services.system_service import SystemService, get_system_service

router = APIRouter()


@router.get("/status")
async def system_status_endpoint(
    system_service: SystemService = Depends(get_system_service),
):
    """Retorna versión, capacidades disponibles (OCR, Word a PDF), idiomas OCR y límite de tamaño."""
    return system_service.get_status()


@router.get("/updates")
async def system_updates_endpoint(
    system_service: SystemService = Depends(get_system_service),
):
    """Comprueba actualizaciones en GitHub Releases con timeout corto y fallback offline silencioso."""
    return await system_service.check_updates()
