import os
import time
from typing import Any, Dict, Optional
import httpx
from packaging.version import Version, InvalidVersion

from app.core.config import settings
from app.utils.binaries import find_tesseract, find_soffice, get_ocr_languages

GITHUB_LATEST_RELEASE_API = "https://api.github.com/repos/albert-dilas/OpenPDF/releases/latest"
DEFAULT_RELEASES_URL = "https://github.com/albert-dilas/OpenPDF/releases"
UPDATE_CACHE_TTL_SECONDS = 6 * 3600  # 6 horas

_update_cache: Optional[Dict[str, Any]] = None
_update_cache_timestamp: float = 0.0


def clear_update_cache() -> None:
    """Limpia la caché en memoria de comprobación de actualizaciones."""
    global _update_cache, _update_cache_timestamp
    _update_cache = None
    _update_cache_timestamp = 0.0


class SystemService:
    @staticmethod
    def get_status() -> Dict[str, Any]:
        ocr_available = find_tesseract() is not None
        word_to_pdf_available = find_soffice() is not None
        ocr_languages = get_ocr_languages() if ocr_available else []
        return {
            "version": settings.VERSION,
            "capabilities": {
                "ocr": ocr_available,
                "word_to_pdf": word_to_pdf_available,
            },
            "ocr_languages": ocr_languages,
            "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
        }

    @staticmethod
    async def check_updates() -> Dict[str, Any]:
        global _update_cache, _update_cache_timestamp

        fallback = {
            "current": settings.VERSION,
            "latest": None,
            "update_available": False,
            "online": False,
            "url": DEFAULT_RELEASES_URL,
        }

        disable_flag = os.environ.get("OPENPDF_DISABLE_UPDATE_CHECK", "").strip().lower()
        if disable_flag in ("1", "true", "yes"):
            return fallback

        now = time.time()
        if _update_cache is not None and (now - _update_cache_timestamp) < UPDATE_CACHE_TTL_SECONDS:
            return dict(_update_cache)

        try:
            headers = {
                "Accept": "application/vnd.github+json",
                "User-Agent": f"OpenPDF/{settings.VERSION}",
            }
            async with httpx.AsyncClient(timeout=3.0, follow_redirects=True) as client:
                response = await client.get(GITHUB_LATEST_RELEASE_API, headers=headers)
                if response.status_code != 200:
                    return fallback

                data = response.json()
                raw_tag = str(data.get("tag_name") or "").strip()
                if not raw_tag:
                    return fallback

                latest_clean = raw_tag.lstrip("vV").strip()
                current_clean = settings.VERSION.lstrip("vV").strip()

                latest_ver = Version(latest_clean)
                current_ver = Version(current_clean)
                update_available = latest_ver > current_ver

                html_url = str(data.get("html_url") or DEFAULT_RELEASES_URL)

                result = {
                    "current": settings.VERSION,
                    "latest": latest_clean,
                    "update_available": bool(update_available),
                    "online": True,
                    "url": html_url,
                }
                _update_cache = dict(result)
                _update_cache_timestamp = time.time()
                return result
        except (httpx.HTTPError, InvalidVersion, ValueError, KeyError, Exception):
            return fallback


def get_system_service() -> SystemService:
    return SystemService()
