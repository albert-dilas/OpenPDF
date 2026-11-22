"""Servicio universal File-First para inspeccion de archivos y registro de assets de sesion."""
from __future__ import annotations

import csv
import hashlib
import io
import json
import mimetypes
import os
import re
import shutil
import subprocess
import tarfile
import uuid
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pymupdf
import yaml
from fastapi import UploadFile
from fastapi.concurrency import run_in_threadpool
from lxml import etree as lxml_etree
from PIL import ExifTags, Image

from app.core.config import settings
from app.core.dependencies import TempFileManager
from app.core.jobs import JobManager, SessionAssetRecord, job_manager
from app.utils.binaries import find_ffprobe

MAX_SHA256_BYTES = 50 * 1024 * 1024  # 50 MB
MAX_DATA_READ_BYTES = 2 * 1024 * 1024  # 2 MB para analisis seguro de datos/texto

PDF_EXTENSIONS = {".pdf"}
VIDEO_EXTENSIONS = {".mp4", ".mkv", ".webm", ".mov", ".avi", ".flv", ".wmv", ".m4v", ".ts", ".mpeg", ".mpg"}
AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".opus", ".m4a", ".aac", ".wma"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif", ".gif", ".ico", ".avif"}
ARCHIVE_EXTENSIONS = {".zip", ".tar", ".gz", ".tgz", ".bz2", ".xz", ".7z", ".rar"}
DATA_EXTENSIONS = {".json", ".yaml", ".yml", ".csv", ".tsv", ".xml", ".md", ".markdown", ".txt", ".log", ".ini", ".toml"}
WORD_EXTENSIONS = {".doc", ".docx"}


def _safe_filename(raw_name: Optional[str]) -> str:
    base = os.path.basename((raw_name or "archivo").strip())
    return base or "archivo"


def _compute_sha256_streaming(file_path: Path, size_bytes: int) -> Optional[str]:
    if size_bytes > MAX_SHA256_BYTES:
        return None
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while True:
            chunk = f.read(1024 * 1024)
            if not chunk:
                break
            hasher.update(chunk)
    return hasher.hexdigest()


def _detect_mime_and_domain(file_path: Path, filename: str) -> Tuple[str, str]:
    ext = Path(filename).suffix.lower() or file_path.suffix.lower()
    guessed_mime, _ = mimetypes.guess_type(filename)

    head = b""
    try:
        with open(file_path, "rb") as f:
            head = f.read(32)
    except OSError:
        pass

    if ext in PDF_EXTENSIONS or head.startswith(b"%PDF"):
        return guessed_mime or "application/pdf", "pdf"

    if ext in VIDEO_EXTENSIONS:
        fallback_video = {
            ".mp4": "video/mp4",
            ".webm": "video/webm",
            ".mkv": "video/x-matroska",
            ".mov": "video/quicktime",
            ".avi": "video/x-msvideo",
        }
        return guessed_mime or fallback_video.get(ext, "video/mp4"), "video"

    if ext in AUDIO_EXTENSIONS:
        fallback_audio = {
            ".mp3": "audio/mpeg",
            ".wav": "audio/wav",
            ".ogg": "audio/ogg",
            ".flac": "audio/flac",
            ".m4a": "audio/mp4",
        }
        return guessed_mime or fallback_audio.get(ext, "audio/mpeg"), "audio"

    if ext in IMAGE_EXTENSIONS or head.startswith((b"\x89PNG", b"\xff\xd8\xff", b"GIF87a", b"GIF89a")):
        return guessed_mime or "image/png", "image"

    if ext in ARCHIVE_EXTENSIONS or filename.lower().endswith((".tar.gz", ".tar.bz2", ".tar.xz")):
        if ext == ".zip":
            return guessed_mime or "application/zip", "archive"
        return guessed_mime or "application/x-archive", "archive"

    if ext in DATA_EXTENSIONS:
        fallback_data = {
            ".json": "application/json",
            ".yaml": "application/yaml",
            ".yml": "application/yaml",
            ".csv": "text/csv",
            ".tsv": "text/tab-separated-values",
            ".xml": "application/xml",
            ".md": "text/markdown",
            ".markdown": "text/markdown",
            ".txt": "text/plain",
        }
        return guessed_mime or fallback_data.get(ext, "text/plain"), "data"

    if ext in WORD_EXTENSIONS:
        mime = (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            if ext == ".docx"
            else "application/msword"
        )
        return guessed_mime or mime, "other"

    if head.startswith(b"PK\x03\x04"):
        return guessed_mime or "application/zip", "archive"

    return guessed_mime or "application/octet-stream", "other"


def _inspect_pdf(file_path: Path) -> Dict[str, Any]:
    meta: Dict[str, Any] = {}
    doc = pymupdf.open(str(file_path))
    try:
        encrypted = bool(doc.is_encrypted)
        meta["pages"] = int(doc.page_count)
        meta["is_encrypted"] = encrypted
        if encrypted:
            meta["has_text"] = None
            return meta

        raw_meta = doc.metadata or {}
        meta["title"] = str(raw_meta.get("title") or "")
        meta["author"] = str(raw_meta.get("author") or "")
        meta["subject"] = str(raw_meta.get("subject") or "")
        meta["creator"] = str(raw_meta.get("creator") or "")
        meta["producer"] = str(raw_meta.get("producer") or "")

        sample_pages = min(3, len(doc))
        has_text = False
        for i in range(sample_pages):
            if (doc[i].get_text("text") or "").strip():
                has_text = True
                break
        meta["has_text"] = has_text

        if len(doc) > 0:
            rect = doc[0].rect
            meta["page_size"] = {
                "width": round(float(rect.width), 2),
                "height": round(float(rect.height), 2),
            }
    finally:
        doc.close()
    return meta


def _parse_fps(raw_rate: Optional[str]) -> Optional[float]:
    if not raw_rate or "/" not in raw_rate:
        return None
    try:
        num_s, den_s = raw_rate.split("/", 1)
        num = float(num_s)
        den = float(den_s)
        if den <= 0:
            return None
        return round(num / den, 2)
    except Exception:
        return None


def inspect_media_with_ffprobe(file_path: Path) -> Dict[str, Any]:
    ffprobe_bin = find_ffprobe()
    if not ffprobe_bin:
        return {"ffprobe_available": False}

    try:
        proc = subprocess.run(
            [
                ffprobe_bin,
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                "-show_streams",
                str(file_path),
            ],
            capture_output=True,
            text=True,
            timeout=15,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        if proc.returncode != 0 or not proc.stdout:
            return {"ffprobe_available": True, "error": "ffprobe no pudo leer el archivo."}

        raw = json.loads(proc.stdout)
        fmt = raw.get("format") or {}
        streams = raw.get("streams") or []

        duration_sec = None
        if fmt.get("duration") is not None:
            try:
                duration_sec = round(float(fmt["duration"]), 3)
            except (TypeError, ValueError):
                pass

        bit_rate = None
        if fmt.get("bit_rate") is not None:
            try:
                bit_rate = int(fmt["bit_rate"])
            except (TypeError, ValueError):
                pass

        video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
        audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

        info: Dict[str, Any] = {
            "ffprobe_available": True,
            "format_name": fmt.get("format_name"),
            "duration_sec": duration_sec,
            "bit_rate": bit_rate,
            "has_video": video_stream is not None,
            "has_audio": audio_stream is not None,
            "stream_count": len(streams),
        }

        if video_stream:
            info["video_codec"] = video_stream.get("codec_name")
            info["width"] = video_stream.get("width")
            info["height"] = video_stream.get("height")
            info["fps"] = _parse_fps(video_stream.get("avg_frame_rate") or video_stream.get("r_frame_rate"))
            info["pix_fmt"] = video_stream.get("pix_fmt")

        if audio_stream:
            info["audio_codec"] = audio_stream.get("codec_name")
            info["sample_rate"] = audio_stream.get("sample_rate")
            info["channels"] = audio_stream.get("channels")

        return info
    except Exception as exc:
        return {"ffprobe_available": True, "error": str(exc)}


def _inspect_image(file_path: Path) -> Dict[str, Any]:
    with Image.open(file_path) as img:
        exif = img.getexif()
        exif_count = len(exif) if exif else 0
        gps_count = 0
        if exif:
            try:
                gps_ifd_tag = getattr(ExifTags.IFD, "GPSInfo", 0x8825)
                gps_ifd = exif.get_ifd(gps_ifd_tag)
                if gps_ifd:
                    gps_count = len(gps_ifd)
            except Exception:
                gps_count = 0

        return {
            "width": int(img.width),
            "height": int(img.height),
            "format": str(img.format or ""),
            "mode": str(img.mode or ""),
            "is_animated": bool(getattr(img, "is_animated", False)),
            "frames": int(getattr(img, "n_frames", 1)),
            "exif_count": exif_count,
            "has_exif": exif_count > 0,
            "gps_count": gps_count,
            "has_gps": gps_count > 0,
        }


def _inspect_archive(file_path: Path, filename: str) -> Dict[str, Any]:
    lower = filename.lower()
    if lower.endswith(".zip") or zipfile.is_zipfile(file_path):
        try:
            with zipfile.ZipFile(file_path, "r") as zf:
                infos = zf.infolist()
                file_infos = [i for i in infos if not i.is_dir()]
                return {
                    "archive_format": "zip",
                    "entry_count": len(file_infos),
                    "total_items": len(infos),
                    "uncompressed_bytes": sum(i.file_size for i in file_infos),
                    "compressed_bytes": sum(i.compress_size for i in file_infos),
                    "sample_entries": [i.filename for i in infos[:50]],
                }
        except Exception as exc:
            return {"archive_format": "zip", "error": str(exc)}

    if lower.endswith((".tar", ".tar.gz", ".tgz", ".tar.bz2", ".tar.xz", ".gz", ".bz2", ".xz")):
        try:
            with tarfile.open(file_path, "r:*") as tf:
                entries: List[str] = []
                entry_count = 0
                uncompressed = 0
                for member in tf:
                    entry_count += 1
                    if member.isfile():
                        uncompressed += member.size
                    if len(entries) < 50:
                        entries.append(member.name)
                    if entry_count >= 5000:
                        break
                return {
                    "archive_format": "tar",
                    "entry_count": entry_count,
                    "uncompressed_bytes": uncompressed,
                    "sample_entries": entries,
                }
        except Exception as exc:
            return {"archive_format": "tar", "error": str(exc)}

    ext = Path(filename).suffix.lower().lstrip(".")
    return {"archive_format": ext or "unknown", "supported_inspection": False}


def _inspect_data(file_path: Path, filename: str, size_bytes: int) -> Dict[str, Any]:
    ext = Path(filename).suffix.lower()
    with open(file_path, "rb") as f:
        raw_bytes = f.read(MAX_DATA_READ_BYTES)

    truncated = size_bytes > MAX_DATA_READ_BYTES
    try:
        text = raw_bytes.decode("utf-8")
        encoding = "utf-8"
    except UnicodeDecodeError:
        text = raw_bytes.decode("latin-1", errors="replace")
        encoding = "latin-1"

    lines = text.splitlines()
    meta: Dict[str, Any] = {
        "format": ext.lstrip(".") or "txt",
        "encoding": encoding,
        "line_count": len(lines),
        "char_count": len(text),
        "truncated": truncated,
    }

    if truncated and ext in (".json", ".yaml", ".yml", ".xml"):
        meta["parse_skipped"] = "Archivo supera limite de 2 MB para parseo en memoria."
        return meta

    if ext == ".json":
        try:
            parsed = json.loads(text)
            meta["valid"] = True
            if isinstance(parsed, dict):
                meta["json_type"] = "object"
                meta["keys_count"] = len(parsed)
                meta["top_keys"] = list(parsed.keys())[:20]
            elif isinstance(parsed, list):
                meta["json_type"] = "array"
                meta["item_count"] = len(parsed)
            else:
                meta["json_type"] = type(parsed).__name__
        except Exception as exc:
            meta["valid"] = False
            meta["parse_error"] = str(exc)

    elif ext in (".yaml", ".yml"):
        try:
            parsed = yaml.safe_load(text)
            meta["valid"] = True
            if isinstance(parsed, dict):
                meta["yaml_type"] = "mapping"
                meta["keys_count"] = len(parsed)
                meta["top_keys"] = [str(k) for k in list(parsed.keys())[:20]]
            elif isinstance(parsed, list):
                meta["yaml_type"] = "sequence"
                meta["item_count"] = len(parsed)
            else:
                meta["yaml_type"] = type(parsed).__name__
        except Exception as exc:
            meta["valid"] = False
            meta["parse_error"] = str(exc)

    elif ext in (".csv", ".tsv"):
        delimiter = "\t" if ext == ".tsv" else ","
        try:
            reader = csv.reader(io.StringIO(text), delimiter=delimiter)
            rows = list(reader)
            meta["valid"] = True
            meta["row_count"] = len(rows)
            if rows:
                meta["column_count"] = len(rows[0])
                meta["columns"] = [str(c) for c in rows[0][:30]]
            else:
                meta["column_count"] = 0
                meta["columns"] = []
        except Exception as exc:
            meta["valid"] = False
            meta["parse_error"] = str(exc)

    elif ext == ".xml":
        try:
            parser = lxml_etree.XMLParser(resolve_entities=False, no_network=True, dtd_validation=False)
            root = lxml_etree.fromstring(raw_bytes, parser=parser)
            meta["valid"] = True
            meta["root_tag"] = str(root.tag)
            meta["child_count"] = len(root)
        except Exception as exc:
            meta["valid"] = False
            meta["parse_error"] = str(exc)

    elif ext in (".md", ".markdown"):
        headings = sum(1 for line in lines if re.match(r"^\s{0,3}#{1,6}\s+", line))
        meta["heading_count"] = headings
        meta["word_count"] = len(text.split())

    else:
        meta["word_count"] = len(text.split())

    return meta


def _compute_suggested_tools(domain: str, filename: str, metadata: Dict[str, Any]) -> List[str]:
    ext = Path(filename).suffix.lower()

    if domain == "pdf":
        if metadata.get("is_encrypted"):
            return ["unlock-pdf", "metadata-pdf"]
        tools = ["compress-pdf", "organize-pdf", "split-pdf", "pdf-to-word", "pdf-to-jpg", "pdf-to-markdown"]
        if metadata.get("has_text") is False:
            tools.insert(0, "ocr-pdf")
        return tools[:6]

    if domain == "video":
        return ["video-studio"]

    if domain == "audio":
        return ["video-studio"]

    if domain == "image":
        tools = ["jpg-to-pdf"]
        if ext == ".gif" and metadata.get("is_animated"):
            tools.append("video-studio")
        return tools

    if ext in WORD_EXTENSIONS:
        return ["word-to-pdf"]

    return []


def inspect_file_sync(
    file_path: Path,
    filename: str,
    asset_id: Optional[str] = None,
    source_job_id: Optional[str] = None,
    manager: Optional[JobManager] = None,
) -> SessionAssetRecord:
    """Inspecciona un archivo ya guardado en SESSION_ASSETS_DIR y registra su SessionAssetRecord."""
    clean_name = _safe_filename(filename)
    size_bytes = file_path.stat().st_size if file_path.is_file() else 0
    mime_type, domain = _detect_mime_and_domain(file_path, clean_name)
    sha256 = _compute_sha256_streaming(file_path, size_bytes)

    metadata: Dict[str, Any] = {}
    try:
        if domain == "pdf":
            metadata = _inspect_pdf(file_path)
        elif domain in ("video", "audio"):
            metadata = inspect_media_with_ffprobe(file_path)
        elif domain == "image":
            metadata = _inspect_image(file_path)
        elif domain == "archive":
            metadata = _inspect_archive(file_path, clean_name)
        elif domain == "data":
            metadata = _inspect_data(file_path, clean_name, size_bytes)
        else:
            metadata = {"extension": Path(clean_name).suffix.lower().lstrip(".")}
    except Exception as exc:
        metadata = {"error": str(exc)}

    suggested_tools = _compute_suggested_tools(domain, clean_name, metadata)
    record = SessionAssetRecord(
        id=asset_id or uuid.uuid4().hex[:16],
        filename=clean_name,
        size_bytes=size_bytes,
        mime_type=mime_type,
        domain=domain,
        sha256=sha256,
        metadata=metadata,
        suggested_tools=suggested_tools,
        source_job_id=source_job_id,
        path=str(file_path.resolve()),
    )
    target_manager = manager or job_manager
    target_manager.register_asset(record)
    return record


class WorkspaceInspectorService:
    async def inspect_upload(
        self,
        upload_file: UploadFile,
        file_manager: TempFileManager,
        manager: Optional[JobManager] = None,
    ) -> SessionAssetRecord:
        clean_name = _safe_filename(upload_file.filename)
        temp_path = await file_manager.save_upload_file(upload_file)
        file_manager.untrack(temp_path)

        asset_id = uuid.uuid4().hex[:16]
        ext = Path(clean_name).suffix.lower() or Path(temp_path).suffix.lower()
        settings.SESSION_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
        dest_path = settings.SESSION_ASSETS_DIR / f"{asset_id}{ext}"

        try:
            shutil.move(temp_path, str(dest_path))
            return await run_in_threadpool(
                inspect_file_sync,
                dest_path,
                clean_name,
                asset_id,
                None,
                manager or job_manager,
            )
        except Exception:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except OSError:
                    pass
            if dest_path.exists():
                try:
                    dest_path.unlink()
                except OSError:
                    pass
            raise


def get_workspace_inspector_service() -> WorkspaceInspectorService:
    return WorkspaceInspectorService()
