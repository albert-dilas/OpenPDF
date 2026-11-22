"""Endpoints del Espacio de Trabajo universal File-First (Bandeja Viva)."""
import os
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse

from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.core.jobs import JobManager, get_job_manager
from app.services.workspace_inspector import (
    WorkspaceInspectorService,
    get_workspace_inspector_service,
)

router = APIRouter()


@router.post("/inspect")
async def inspect_workspace_file_endpoint(
    file: UploadFile = File(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    inspector: WorkspaceInspectorService = Depends(get_workspace_inspector_service),
    manager: JobManager = Depends(get_job_manager),
):
    """Sube un archivo a la sesion, detecta dominio, extrae metadatos y sugiere herramientas."""
    asset = await inspector.inspect_upload(file, file_manager, manager=manager)
    return {"asset": asset.to_public_dict()}


@router.get("/assets")
async def list_workspace_assets_endpoint(
    limit: Optional[int] = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    domain: Optional[str] = Query(default=None),
    manager: JobManager = Depends(get_job_manager),
):
    """Lista los archivos registrados en la sesion actual con filtro y paginacion opcional."""
    all_items = manager.list_assets()
    clean_domain = (domain or "").strip().lower()
    if clean_domain and clean_domain != "all":
        all_items = [asset for asset in all_items if asset.domain == clean_domain]

    total = len(all_items)
    sliced = all_items[offset : offset + limit] if limit is not None else all_items[offset:]
    page_items = [asset.to_public_dict() for asset in sliced]
    has_more = (offset + len(page_items)) < total
    next_offset = (offset + len(page_items)) if has_more else None
    return {
        "assets": page_items,
        "total": total,
        "has_more": has_more,
        "next_offset": next_offset,
    }


@router.get("/assets/{asset_id}/download")
async def download_workspace_asset_endpoint(
    asset_id: str,
    inline: bool = Query(default=False),
    manager: JobManager = Depends(get_job_manager),
):
    """Sirve o descarga un asset de sesion con soporte nativo HTTP Range para preview HTML5."""
    asset = manager.get_asset(asset_id)
    if not asset or not os.path.isfile(asset.path):
        raise HTTPException(status_code=404, detail="Archivo de sesion no encontrado.")

    return FileResponse(
        path=asset.path,
        filename=asset.filename,
        media_type=asset.mime_type or "application/octet-stream",
        content_disposition_type="inline" if inline else "attachment",
    )


@router.delete("/assets/{asset_id}")
async def delete_workspace_asset_endpoint(
    asset_id: str,
    manager: JobManager = Depends(get_job_manager),
):
    """Elimina un asset especifico de la sesion actual."""
    deleted = manager.delete_asset(asset_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Archivo de sesion no encontrado.")
    return {"deleted": True, "id": asset_id}


@router.delete("/assets")
async def clear_workspace_assets_endpoint(
    manager: JobManager = Depends(get_job_manager),
):
    """Vacia todos los assets almacenados en la sesion actual."""
    deleted_count = manager.clear_assets()
    return {"deleted_count": deleted_count}
