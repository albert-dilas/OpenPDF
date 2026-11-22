"""Servicio de inspeccion y transcodificacion/recorte de video mediante FFmpeg con progreso real SSE."""
from __future__ import annotations

import math
import os
import subprocess
import threading
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.exceptions import BusinessRuleError
from app.core.jobs import JobManager, JobRecord, job_manager
from app.services.workspace_inspector import inspect_file_sync, inspect_media_with_ffprobe
from app.utils.binaries import find_ffmpeg, find_ffprobe

ALLOWED_VIDEO_FORMATS = {"mp4", "webm", "mkv", "gif"}
ALLOWED_QUALITIES = {"high", "medium", "compact"}
ALLOWED_RESOLUTIONS = {"original", "1080", "720", "480"}

VIDEO_MIME_TYPES = {
    "mp4": "video/mp4",
    "webm": "video/webm",
    "mkv": "video/x-matroska",
    "gif": "image/gif",
}


def _validate_time_bounds(start_sec: Optional[float], end_sec: Optional[float]) -> None:
    if start_sec is not None:
        if not math.isfinite(start_sec) or start_sec < 0:
            raise BusinessRuleError("El tiempo de inicio (start_sec) debe ser mayor o igual a 0.")
    if end_sec is not None:
        if not math.isfinite(end_sec) or end_sec <= 0:
            raise BusinessRuleError("El tiempo de fin (end_sec) debe ser mayor a 0.")
    if start_sec is not None and end_sec is not None and end_sec <= start_sec:
        raise BusinessRuleError("El tiempo de fin debe ser mayor al tiempo de inicio.")


def _compute_target_duration(
    source_duration: Optional[float],
    start_sec: Optional[float],
    end_sec: Optional[float],
) -> float:
    src = float(source_duration or 0.0)
    eff_start = float(start_sec or 0.0) if (start_sec is not None and start_sec > 0) else 0.0
    if end_sec is not None:
        eff_end = min(float(end_sec), src) if src > 0 else float(end_sec)
        return max(0.05, eff_end - eff_start)
    if src > eff_start:
        return max(0.05, src - eff_start)
    return max(0.0, src)


def _build_ffmpeg_command(
    ffmpeg_bin: str,
    input_path: str,
    output_path: str,
    output_format: str,
    quality: str,
    resolution: str,
    start_sec: Optional[float],
    end_sec: Optional[float],
    remove_audio: bool,
    fast_copy: bool,
) -> List[str]:
    cmd: List[str] = [
        ffmpeg_bin,
        "-y",
        "-hide_banner",
        "-progress",
        "pipe:1",
        "-nostats",
    ]

    if start_sec is not None and start_sec > 0:
        cmd.extend(["-ss", f"{start_sec:.3f}"])

    cmd.extend(["-i", input_path])

    if end_sec is not None:
        clip_duration = end_sec - (start_sec if (start_sec is not None and start_sec > 0) else 0.0)
        if clip_duration > 0:
            cmd.extend(["-t", f"{clip_duration:.3f}"])

    use_fast_copy = bool(fast_copy and output_format in ("mp4", "mkv", "webm") and resolution == "original")
    if use_fast_copy:
        cmd.extend(["-c:v", "copy"])
        if remove_audio:
            cmd.append("-an")
        else:
            cmd.extend(["-c:a", "copy"])
        if output_format == "mp4":
            cmd.extend(["-movflags", "+faststart"])
        cmd.append(output_path)
        return cmd

    if output_format == "gif":
        fps = {"high": 15, "medium": 12, "compact": 10}[quality]
        scale_expr = f"-2:{resolution}" if resolution != "original" else "iw:-2"
        vf = (
            f"fps={fps},scale={scale_expr}:flags=lanczos,"
            "split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse"
        )
        cmd.extend(["-an", "-vf", vf, output_path])
        return cmd

    # Video codecs (mp4 / mkv / webm)
    scale_filter = (
        f"scale=-2:{resolution}"
        if resolution != "original"
        else "scale=trunc(iw/2)*2:trunc(ih/2)*2"
    )
    cmd.extend(["-vf", scale_filter])

    if output_format == "webm":
        crf = {"high": "24", "medium": "32", "compact": "38"}[quality]
        audio_br = {"high": "160k", "medium": "128k", "compact": "96k"}[quality]
        cmd.extend(["-c:v", "libvpx-vp9", "-crf", crf, "-b:v", "0", "-deadline", "realtime", "-cpu-used", "4", "-row-mt", "1"])
        if remove_audio:
            cmd.append("-an")
        else:
            cmd.extend(["-c:a", "libopus", "-b:a", audio_br])
    else:
        crf = {"high": "18", "medium": "23", "compact": "28"}[quality]
        audio_br = {"high": "192k", "medium": "128k", "compact": "96k"}[quality]
        cmd.extend(["-c:v", "libx264", "-preset", "veryfast", "-crf", crf, "-pix_fmt", "yuv420p"])
        if remove_audio:
            cmd.append("-an")
        else:
            cmd.extend(["-c:a", "aac", "-b:a", audio_br])
        if output_format == "mp4":
            cmd.extend(["-movflags", "+faststart"])

    cmd.append(output_path)
    return cmd


def _run_ffmpeg_job_worker(
    job_id: str,
    ffmpeg_bin: str,
    input_path: str,
    source_filename: str,
    owns_input: bool,
    output_format: str,
    quality: str,
    resolution: str,
    start_sec: Optional[float],
    end_sec: Optional[float],
    remove_audio: bool,
    fast_copy: bool,
    target_duration_sec: float,
    manager: JobManager,
) -> None:
    out_asset_id = uuid.uuid4().hex[:16]
    settings.SESSION_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    output_path = settings.SESSION_ASSETS_DIR / f"{out_asset_id}.{output_format}"
    stem = Path(source_filename).stem or "video"
    output_filename = f"{stem}_tornio.{output_format}"
    output_mime = VIDEO_MIME_TYPES.get(output_format, "application/octet-stream")

    try:
        if manager.is_cancelled(job_id):
            return

        manager.start_job(job_id, detail="Iniciando motor FFmpeg...")
        cmd = _build_ffmpeg_command(
            ffmpeg_bin=ffmpeg_bin,
            input_path=input_path,
            output_path=str(output_path),
            output_format=output_format,
            quality=quality,
            resolution=resolution,
            start_sec=start_sec,
            end_sec=end_sec,
            remove_audio=remove_audio,
            fast_copy=fast_copy,
        )

        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        manager.register_process(job_id, proc)

        stderr_chunks: List[str] = []

        def _drain_stderr() -> None:
            if proc.stderr is None:
                return
            try:
                for err_line in proc.stderr:
                    if len(stderr_chunks) < 60:
                        stderr_chunks.append(err_line.rstrip())
            except Exception:
                pass

        err_thread = threading.Thread(target=_drain_stderr, daemon=True)
        err_thread.start()

        current_out_us = 0
        current_speed = ""
        last_pct = 0

        if proc.stdout is not None:
            for raw_line in proc.stdout:
                if manager.is_cancelled(job_id):
                    break
                line = raw_line.strip()
                if not line or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                if key == "out_time_us":
                    try:
                        parsed_us = int(val)
                        if parsed_us >= 0:
                            current_out_us = parsed_us
                    except ValueError:
                        pass
                elif key == "speed":
                    if val and val != "N/A":
                        current_speed = val.strip()
                elif key == "progress":
                    if target_duration_sec > 0:
                        pct = int(((current_out_us / 1_000_000.0) / target_duration_sec) * 100)
                        pct = max(1, min(98, pct))
                    else:
                        pct = min(95, last_pct + 5)

                    if val == "end":
                        pct = max(pct, 99)

                    if pct != last_pct or current_speed:
                        last_pct = pct
                        detail = f"Procesando video ({current_speed})" if current_speed else "Procesando video..."
                        manager.update_progress(job_id, pct, stage="processing", detail=detail)

        return_code = proc.wait()
        err_thread.join(timeout=2.0)
        for pipe in (proc.stdout, proc.stderr):
            if pipe is not None:
                try:
                    pipe.close()
                except Exception:
                    pass
        manager.unregister_process(job_id)

        if manager.is_cancelled(job_id):
            if output_path.is_file():
                try:
                    output_path.unlink()
                except OSError:
                    pass
            return

        if return_code != 0 or not output_path.is_file() or output_path.stat().st_size == 0:
            if output_path.is_file():
                try:
                    output_path.unlink()
                except OSError:
                    pass
            tail_err = " | ".join(stderr_chunks[-3:]) if stderr_chunks else f"codigo {return_code}"
            manager.fail_job(job_id, error=f"FFmpeg fallo al procesar el video ({tail_err}).")
            return

        asset = inspect_file_sync(
            file_path=output_path,
            filename=output_filename,
            asset_id=out_asset_id,
            source_job_id=job_id,
            manager=manager,
        )
        manager.complete_job(
            job_id,
            output_path=str(output_path),
            output_filename=output_filename,
            output_mime=output_mime,
            output_asset_id=asset.id,
            detail=f"Video exportado ({output_format.upper()})",
        )
    except Exception as exc:
        if output_path.is_file():
            try:
                output_path.unlink()
            except OSError:
                pass
        manager.fail_job(job_id, error=f"Error procesando video: {str(exc)}")
    finally:
        if "proc" in locals():
            for pipe in (getattr(proc, "stdout", None), getattr(proc, "stderr", None)):
                if pipe is not None:
                    try:
                        pipe.close()
                    except Exception:
                        pass
        manager.unregister_process(job_id)
        if owns_input and input_path and os.path.isfile(input_path):
            try:
                os.remove(input_path)
            except OSError:
                pass


class MediaVideoService:
    @staticmethod
    async def inspect_video_file(source_path: str, filename: str, asset_id: Optional[str] = None) -> Dict[str, Any]:
        if not find_ffprobe():
            raise BusinessRuleError(
                "FFprobe no encontrado. Instala FFmpeg desde el Gestor de Modulos para inspeccionar video."
            )
        probe = await run_in_threadpool(inspect_media_with_ffprobe, Path(source_path))
        if probe.get("error"):
            raise BusinessRuleError(f"No se pudo inspeccionar el video: {probe['error']}")
        return {
            "filename": filename,
            "size_bytes": os.path.getsize(source_path),
            "asset_id": asset_id,
            **probe,
        }

    @staticmethod
    async def start_process_job(
        input_path: str,
        source_filename: str,
        owns_input: bool,
        start_sec: Optional[float] = None,
        end_sec: Optional[float] = None,
        output_format: str = "mp4",
        quality: str = "medium",
        resolution: str = "original",
        remove_audio: bool = False,
        fast_copy: bool = False,
        manager: Optional[JobManager] = None,
    ) -> JobRecord:
        ffmpeg_bin = find_ffmpeg()
        if not ffmpeg_bin:
            raise BusinessRuleError(
                "Motor FFmpeg no encontrado. Puedes instalarlo con 1 clic desde Configuracion -> Modulos."
            )

        clean_fmt = (output_format or "mp4").strip().lower()
        if clean_fmt not in ALLOWED_VIDEO_FORMATS:
            raise BusinessRuleError(
                f"Formato de salida invalido: '{output_format}'. Valores permitidos: mp4, webm, mkv, gif."
            )

        clean_quality = (quality or "medium").strip().lower()
        if clean_quality not in ALLOWED_QUALITIES:
            raise BusinessRuleError(
                f"Calidad invalida: '{quality}'. Valores permitidos: high, medium, compact."
            )

        clean_res = (resolution or "original").strip().lower()
        if clean_res not in ALLOWED_RESOLUTIONS:
            raise BusinessRuleError(
                f"Resolucion invalida: '{resolution}'. Valores permitidos: original, 1080, 720, 480."
            )

        _validate_time_bounds(start_sec, end_sec)

        src_duration = None
        if find_ffprobe():
            probe = await run_in_threadpool(inspect_media_with_ffprobe, Path(input_path))
            src_duration = probe.get("duration_sec")

        target_duration_sec = _compute_target_duration(src_duration, start_sec, end_sec)
        input_bytes = os.path.getsize(input_path) if os.path.isfile(input_path) else 0
        target_manager = manager or job_manager

        job = target_manager.create_job(
            tool_id="video-studio",
            studio="video",
            title=f"{Path(source_filename).stem or 'video'} -> {clean_fmt.upper()}",
            input_bytes=input_bytes,
            can_cancel=True,
            detail="Trabajo en cola",
        )

        worker = threading.Thread(
            target=_run_ffmpeg_job_worker,
            kwargs={
                "job_id": job.id,
                "ffmpeg_bin": ffmpeg_bin,
                "input_path": input_path,
                "source_filename": source_filename,
                "owns_input": owns_input,
                "output_format": clean_fmt,
                "quality": clean_quality,
                "resolution": clean_res,
                "start_sec": start_sec,
                "end_sec": end_sec,
                "remove_audio": bool(remove_audio),
                "fast_copy": bool(fast_copy),
                "target_duration_sec": target_duration_sec,
                "manager": target_manager,
            },
            daemon=True,
        )
        worker.start()
        return job


def get_media_video_service() -> MediaVideoService:
    return MediaVideoService()
