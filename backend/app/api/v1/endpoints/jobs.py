"""Endpoints REST y SSE para gestion de trabajos asincronos en Tornio."""
import asyncio
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse, StreamingResponse

from app.core.exceptions import BusinessRuleError
from app.core.jobs import JobManager, _utc_iso_now, get_job_manager, serialize_sse_event

router = APIRouter()


@router.get("/")
async def list_jobs_endpoint(
    limit: Optional[int] = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    manager: JobManager = Depends(get_job_manager),
):
    """Lista los trabajos registrados en la sesion actual con paginacion opcional."""
    all_items = manager.list_jobs()
    total = len(all_items)
    sliced = all_items[offset : offset + limit] if limit is not None else all_items[offset:]
    page_items = [job.to_public_dict() for job in sliced]
    has_more = (offset + len(page_items)) < total
    next_offset = (offset + len(page_items)) if has_more else None
    return {
        "jobs": page_items,
        "total": total,
        "has_more": has_more,
        "next_offset": next_offset,
    }


@router.get("/stream")
async def stream_jobs_endpoint(
    request: Request,
    max_events: Optional[int] = Query(default=None, ge=1),
    manager: JobManager = Depends(get_job_manager),
):
    """Stream SSE en tiempo real con snapshot inicial, actualizaciones de trabajos y pings."""
    loop = asyncio.get_running_loop()
    sub_id, queue, snapshot = manager.subscribe(loop)

    async def event_generator():
        sent_count = 0
        try:
            yield serialize_sse_event("snapshot", {"jobs": snapshot})
            sent_count += 1
            if max_events is not None and sent_count >= max_events:
                return

            while True:
                if await request.is_disconnected():
                    break
                try:
                    event_name, payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield serialize_sse_event(event_name, payload)
                except asyncio.TimeoutError:
                    yield serialize_sse_event("ping", {"ts": _utc_iso_now()})

                sent_count += 1
                if max_events is not None and sent_count >= max_events:
                    return
        finally:
            manager.unsubscribe(sub_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{job_id}")
async def get_job_endpoint(
    job_id: str,
    manager: JobManager = Depends(get_job_manager),
):
    """Obtiene el estado de un trabajo por su ID."""
    job = manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado.")
    return {"job": job.to_public_dict()}


@router.post("/{job_id}/cancel")
async def cancel_job_endpoint(
    job_id: str,
    manager: JobManager = Depends(get_job_manager),
):
    """Solicita la cancelacion real de un trabajo y termina su subproceso si sigue activo."""
    job = manager.cancel_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado.")
    return {"job": job.to_public_dict()}


@router.get("/{job_id}/download")
async def download_job_output_endpoint(
    job_id: str,
    manager: JobManager = Depends(get_job_manager),
):
    """Descarga el archivo resultante de un trabajo completado."""
    job = manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado.")
    if job.status != "completed":
        raise BusinessRuleError("El trabajo aun no se ha completado o fue cancelado.")

    output_path = manager.get_job_output_path(job_id)
    if not output_path or not os.path.isfile(output_path):
        raise HTTPException(status_code=404, detail="El archivo de salida ya no esta disponible.")

    return FileResponse(
        path=output_path,
        filename=job.output_filename or os.path.basename(output_path),
        media_type=job.output_mime or "application/octet-stream",
    )


@router.delete("/{job_id}")
async def delete_job_endpoint(
    job_id: str,
    manager: JobManager = Depends(get_job_manager),
):
    """Elimina un trabajo de la lista de sesion (y detiene su proceso si sigue activo)."""
    deleted = manager.delete_job(job_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado.")
    return {"deleted": True, "id": job_id}
