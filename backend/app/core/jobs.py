"""Motor de trabajos asincronos en memoria, registro de procesos cancelables, stream SSE y assets de sesion."""
from __future__ import annotations

import asyncio
import json
import os
import subprocess
import threading
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings
from app.core.logging import logger


def _utc_iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class JobRecord:
    id: str
    tool_id: str
    studio: str
    title: str
    status: str = "queued"
    progress: int = 0
    stage: str = "queued"
    detail: str = ""
    created_at: str = field(default_factory=_utc_iso_now)
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    elapsed_ms: int = 0
    input_bytes: int = 0
    output_bytes: int = 0
    output_asset_id: Optional[str] = None
    output_filename: Optional[str] = None
    output_mime: Optional[str] = None
    error: Optional[str] = None
    can_cancel: bool = True
    _output_path: Optional[str] = field(default=None, repr=False)
    _created_mono: float = field(default_factory=time.perf_counter, repr=False)
    _started_mono: Optional[float] = field(default=None, repr=False)

    def to_public_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "tool_id": self.tool_id,
            "studio": self.studio,
            "title": self.title,
            "status": self.status,
            "progress": self.progress,
            "stage": self.stage,
            "detail": self.detail,
            "created_at": self.created_at,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "elapsed_ms": self.elapsed_ms,
            "input_bytes": self.input_bytes,
            "output_bytes": self.output_bytes,
            "output_asset_id": self.output_asset_id,
            "output_filename": self.output_filename,
            "output_mime": self.output_mime,
            "error": self.error,
            "can_cancel": self.can_cancel,
        }


@dataclass
class SessionAssetRecord:
    id: str
    filename: str
    size_bytes: int
    mime_type: str
    domain: str
    sha256: Optional[str]
    metadata: Dict[str, Any]
    suggested_tools: List[str]
    created_at: str = field(default_factory=_utc_iso_now)
    source_job_id: Optional[str] = None
    path: str = field(default="", repr=False)
    _created_mono: float = field(default_factory=time.perf_counter, repr=False)

    def to_public_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "filename": self.filename,
            "size_bytes": self.size_bytes,
            "mime_type": self.mime_type,
            "domain": self.domain,
            "sha256": self.sha256,
            "metadata": self.metadata,
            "suggested_tools": list(self.suggested_tools),
            "created_at": self.created_at,
            "source_job_id": self.source_job_id,
        }


class JobManager:
    """Gestor thread-safe de trabajos asincronos, procesos cancelables, SSE y assets de sesion."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._jobs: Dict[str, JobRecord] = {}
        self._processes: Dict[str, subprocess.Popen] = {}
        self._cancelled: set[str] = set()
        self._assets: Dict[str, SessionAssetRecord] = {}
        self._subscribers: Dict[int, Tuple[asyncio.AbstractEventLoop, asyncio.Queue]] = {}
        self._next_sub_id: int = 1

    @staticmethod
    def _safe_queue_put(queue: asyncio.Queue, item: Tuple[str, Dict[str, Any]]) -> None:
        if queue.full():
            try:
                queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
        try:
            queue.put_nowait(item)
        except asyncio.QueueFull:
            pass

    def _notify_locked(self, event_name: str, payload: Dict[str, Any]) -> None:
        stale_ids: List[int] = []
        for sub_id, (loop, queue) in list(self._subscribers.items()):
            try:
                if loop.is_closed():
                    stale_ids.append(sub_id)
                    continue
                loop.call_soon_threadsafe(self._safe_queue_put, queue, (event_name, payload))
            except RuntimeError:
                stale_ids.append(sub_id)
        for sub_id in stale_ids:
            self._subscribers.pop(sub_id, None)

    def subscribe(self, loop: asyncio.AbstractEventLoop) -> Tuple[int, asyncio.Queue, List[Dict[str, Any]]]:
        queue: asyncio.Queue = asyncio.Queue(maxsize=256)
        with self._lock:
            sub_id = self._next_sub_id
            self._next_sub_id += 1
            self._subscribers[sub_id] = (loop, queue)
            snapshot = [j.to_public_dict() for j in self._ordered_jobs_locked()]
        return sub_id, queue, snapshot

    def unsubscribe(self, sub_id: int) -> None:
        with self._lock:
            self._subscribers.pop(sub_id, None)

    def _ordered_jobs_locked(self) -> List[JobRecord]:
        return sorted(self._jobs.values(), key=lambda j: j._created_mono, reverse=True)

    def create_job(
        self,
        tool_id: str,
        studio: str,
        title: str,
        input_bytes: int = 0,
        can_cancel: bool = True,
        detail: str = "En cola",
    ) -> JobRecord:
        job_id = uuid.uuid4().hex[:16]
        record = JobRecord(
            id=job_id,
            tool_id=tool_id,
            studio=studio,
            title=title,
            status="queued",
            progress=0,
            stage="queued",
            detail=detail,
            input_bytes=max(0, int(input_bytes)),
            can_cancel=can_cancel,
        )
        with self._lock:
            self._jobs[job_id] = record
            self._notify_locked("job_updated", {"job": record.to_public_dict()})
        return record

    def start_job(self, job_id: str, detail: str = "Iniciando...") -> Optional[JobRecord]:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job or job_id in self._cancelled or job.status == "cancelled":
                return job
            job.status = "running"
            job.stage = "running"
            job.detail = detail
            job.started_at = job.started_at or _utc_iso_now()
            if job._started_mono is None:
                job._started_mono = time.perf_counter()
            self._notify_locked("job_updated", {"job": job.to_public_dict()})
            return job

    def update_progress(
        self,
        job_id: str,
        progress: int,
        stage: Optional[str] = None,
        detail: Optional[str] = None,
    ) -> Optional[JobRecord]:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job or job_id in self._cancelled or job.status in ("cancelled", "completed", "failed"):
                return job
            if job.status == "queued":
                job.status = "running"
                job.started_at = job.started_at or _utc_iso_now()
                if job._started_mono is None:
                    job._started_mono = time.perf_counter()
            job.progress = max(0, min(100, int(progress)))
            if stage is not None:
                job.stage = stage
            if detail is not None:
                job.detail = detail
            if job._started_mono is not None:
                job.elapsed_ms = int((time.perf_counter() - job._started_mono) * 1000)
            self._notify_locked("job_updated", {"job": job.to_public_dict()})
            return job

    def complete_job(
        self,
        job_id: str,
        output_path: Optional[str],
        output_filename: Optional[str],
        output_mime: Optional[str],
        output_asset_id: Optional[str] = None,
        detail: str = "Completado",
    ) -> Optional[JobRecord]:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            if job_id in self._cancelled or job.status == "cancelled":
                return job
            job.status = "completed"
            job.progress = 100
            job.stage = "completed"
            job.detail = detail
            job.finished_at = _utc_iso_now()
            job.can_cancel = False
            job._output_path = output_path
            job.output_filename = output_filename
            job.output_mime = output_mime
            job.output_asset_id = output_asset_id
            if output_path and os.path.isfile(output_path):
                job.output_bytes = os.path.getsize(output_path)
            if job._started_mono is not None:
                job.elapsed_ms = int((time.perf_counter() - job._started_mono) * 1000)
            else:
                job.elapsed_ms = int((time.perf_counter() - job._created_mono) * 1000)
            self._processes.pop(job_id, None)
            self._notify_locked("job_updated", {"job": job.to_public_dict()})
            return job

    def fail_job(self, job_id: str, error: str, detail: Optional[str] = None) -> Optional[JobRecord]:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            if job_id in self._cancelled or job.status == "cancelled":
                return job
            job.status = "failed"
            job.stage = "failed"
            job.error = error
            job.detail = detail or error
            job.finished_at = _utc_iso_now()
            job.can_cancel = False
            if job._started_mono is not None:
                job.elapsed_ms = int((time.perf_counter() - job._started_mono) * 1000)
            self._processes.pop(job_id, None)
            self._notify_locked("job_updated", {"job": job.to_public_dict()})
            return job

    def register_process(self, job_id: str, proc: subprocess.Popen) -> None:
        should_terminate = False
        with self._lock:
            if job_id in self._cancelled:
                should_terminate = True
            else:
                self._processes[job_id] = proc
        if should_terminate:
            self._terminate_proc_safely(proc)

    def unregister_process(self, job_id: str) -> None:
        with self._lock:
            self._processes.pop(job_id, None)

    def is_cancelled(self, job_id: str) -> bool:
        with self._lock:
            if job_id in self._cancelled:
                return True
            job = self._jobs.get(job_id)
            return bool(job and job.status == "cancelled")

    @staticmethod
    def _terminate_proc_safely(proc: subprocess.Popen) -> None:
        try:
            if proc.poll() is None:
                proc.terminate()
        except Exception as exc:
            logger.warning("No se pudo terminar el subproceso de trabajo: %s", exc)

    def cancel_job(self, job_id: str) -> Optional[JobRecord]:
        proc_to_kill: Optional[subprocess.Popen] = None
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            self._cancelled.add(job_id)
            proc_to_kill = self._processes.pop(job_id, None)
            if job.status in ("queued", "running"):
                job.status = "cancelled"
                job.stage = "cancelled"
                job.detail = "Cancelado por el usuario"
                job.finished_at = _utc_iso_now()
                job.can_cancel = False
                if job._started_mono is not None:
                    job.elapsed_ms = int((time.perf_counter() - job._started_mono) * 1000)
                self._notify_locked("job_updated", {"job": job.to_public_dict()})

        if proc_to_kill is not None:
            self._terminate_proc_safely(proc_to_kill)
        return job

    def get_job(self, job_id: str) -> Optional[JobRecord]:
        with self._lock:
            return self._jobs.get(job_id)

    def list_jobs(self) -> List[JobRecord]:
        with self._lock:
            return list(self._ordered_jobs_locked())

    def get_job_output_path(self, job_id: str) -> Optional[str]:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            return job._output_path

    def delete_job(self, job_id: str) -> bool:
        proc_to_kill: Optional[subprocess.Popen] = None
        path_to_remove: Optional[str] = None
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return False
            self._cancelled.add(job_id)
            proc_to_kill = self._processes.pop(job_id, None)

            # Conservar archivo si pertenece a un SessionAsset activo
            linked_asset = self._assets.get(job.output_asset_id) if job.output_asset_id else None
            if job._output_path and (linked_asset is None or linked_asset.path != job._output_path):
                path_to_remove = job._output_path

            self._jobs.pop(job_id, None)
            self._cancelled.discard(job_id)

        if proc_to_kill is not None:
            self._terminate_proc_safely(proc_to_kill)
        if path_to_remove and os.path.isfile(path_to_remove):
            try:
                os.remove(path_to_remove)
            except OSError:
                pass
        return True

    # --- Session Assets ---

    def register_asset(self, asset: SessionAssetRecord) -> SessionAssetRecord:
        with self._lock:
            self._assets[asset.id] = asset
        return asset

    def get_asset(self, asset_id: str) -> Optional[SessionAssetRecord]:
        with self._lock:
            return self._assets.get(asset_id)

    def list_assets(self) -> List[SessionAssetRecord]:
        with self._lock:
            return sorted(
                self._assets.values(),
                key=lambda a: (a.created_at, a._created_mono),
                reverse=True,
            )

    @staticmethod
    def _delete_file_if_safe(filepath: str) -> None:
        if not filepath:
            return
        try:
            resolved = Path(filepath).resolve()
            temp_root = Path(settings.TEMP_DIR).resolve()
            resolved.relative_to(temp_root)
            if resolved.is_file():
                resolved.unlink()
        except Exception:
            pass

    def delete_asset(self, asset_id: str) -> bool:
        with self._lock:
            asset = self._assets.pop(asset_id, None)
            if not asset:
                return False
            path_to_remove = asset.path
        self._delete_file_if_safe(path_to_remove)
        return True

    def clear_assets(self) -> int:
        with self._lock:
            items = list(self._assets.values())
            self._assets.clear()
        for asset in items:
            self._delete_file_if_safe(asset.path)
        return len(items)

    def clear_all(self) -> None:
        """Limpia trabajos y assets de sesion (principalmente para tests)."""
        with self._lock:
            job_ids = list(self._jobs.keys())
        for jid in job_ids:
            self.delete_job(jid)
        self.clear_assets()


job_manager = JobManager()


def get_job_manager() -> JobManager:
    return job_manager


def serialize_sse_event(event_name: str, data: Dict[str, Any]) -> str:
    return f"event: {event_name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
