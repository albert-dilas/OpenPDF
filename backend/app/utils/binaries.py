"""Detección multiplataforma y cacheada de binarios externos (Tesseract OCR y LibreOffice)."""
from functools import lru_cache
from pathlib import Path
from typing import List, Optional
import os
import shutil
import sys
import pytesseract

from app.core.config import settings


def _candidate_roots() -> List[Path]:
    """Retorna directorios raíz candidatos para buscar binarios embebidos (bundle/portable)."""
    roots: List[Path] = []
    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        roots.append(Path(meipass))
    if sys.executable:
        roots.append(Path(sys.executable).resolve().parent)
    roots.append(settings.BASE_DIR)
    roots.append(settings.BASE_DIR.parent)
    roots.append(Path.cwd())

    unique_roots: List[Path] = []
    seen = set()
    for r in roots:
        try:
            resolved = r.resolve()
        except OSError:
            resolved = r
        if resolved not in seen:
            seen.add(resolved)
            unique_roots.append(resolved)
    return unique_roots


@lru_cache(maxsize=1)
def find_tesseract() -> Optional[str]:
    """
    Detecta el binario de Tesseract-OCR.
    Orden de búsqueda:
    1. PATH del sistema (shutil.which)
    2. Rutas bundle relativas a _MEIPASS / ejecutable / BASE_DIR / cwd
    3. Rutas estándar de Windows
    """
    system_bin = shutil.which("tesseract")
    if system_bin:
        return system_bin

    relative_candidates = [
        Path("bin") / "Tesseract-OCR" / "tesseract.exe",
        Path("bin") / "Tesseract-OCR" / "tesseract",
        Path("Tesseract-OCR") / "tesseract.exe",
        Path("Tesseract-OCR") / "tesseract",
    ]
    for root in _candidate_roots():
        for rel in relative_candidates:
            candidate = root / rel
            if candidate.is_file():
                return str(candidate)

    windows_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    ]
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        windows_paths.append(os.path.join(local_app_data, "Programs", "Tesseract-OCR", "tesseract.exe"))

    for path in windows_paths:
        if os.path.isfile(path):
            return path

    return None


@lru_cache(maxsize=1)
def find_soffice() -> Optional[str]:
    """
    Detecta el binario de LibreOffice (soffice).
    Orden de búsqueda:
    1. PATH del sistema (shutil.which)
    2. Rutas bundle relativas a _MEIPASS / ejecutable / BASE_DIR / cwd
    3. Rutas estándar de Windows y macOS
    """
    system_bin = shutil.which("soffice") or shutil.which("libreoffice")
    if system_bin:
        return system_bin

    relative_candidates = [
        Path("bin") / "LibreOfficePortable" / "App" / "libreoffice" / "program" / "soffice.exe",
        Path("bin") / "LibreOffice" / "program" / "soffice.exe",
        Path("bin") / "LibreOffice" / "program" / "soffice",
        Path("LibreOfficePortable") / "App" / "libreoffice" / "program" / "soffice.exe",
    ]
    for root in _candidate_roots():
        for rel in relative_candidates:
            candidate = root / rel
            if candidate.is_file():
                return str(candidate)

    standard_paths = [
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    ]
    for path in standard_paths:
        if os.path.isfile(path):
            return path

    return None


@lru_cache(maxsize=1)
def get_ocr_languages() -> List[str]:
    """Retorna la lista de idiomas instalados en Tesseract (o lista vacía si no está disponible)."""
    tess_path = find_tesseract()
    if not tess_path:
        return []
    pytesseract.pytesseract.tesseract_cmd = tess_path
    try:
        langs = pytesseract.get_languages(config="")
        return sorted(lang for lang in langs if lang and lang != "osd")
    except Exception:
        return []


def clear_binaries_cache() -> None:
    """Limpia la caché de detección de binarios (útil para tests)."""
    find_tesseract.cache_clear()
    find_soffice.cache_clear()
    get_ocr_languages.cache_clear()
