"""Deteccion multiplataforma, persistente y cacheada de binarios externos (Tesseract OCR, LibreOffice, MS Word y WinGet)."""
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import glob
import json
import os
import shutil
import subprocess
import sys
import pytesseract

from app.core.config import settings


def _get_config_file_path() -> Path:
    env_path = os.environ.get("OPENPDF_CONFIG_PATH", "").strip()
    if env_path:
        return Path(env_path)
    return Path(settings.USER_CONFIG_PATH)


def _get_user_tessdata_dir() -> Path:
    env_dir = os.environ.get("OPENPDF_TESSDATA_DIR", "").strip()
    if env_dir:
        return Path(env_dir)
    return Path(settings.USER_TESSDATA_DIR)


def load_user_config() -> Dict[str, Any]:
    """Carga la configuracion persistente del usuario desde config.json."""
    cfg_path = _get_config_file_path()
    if not cfg_path.is_file():
        return {"custom_paths": {}}
    try:
        data = json.loads(cfg_path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return {"custom_paths": {}}
        if "custom_paths" not in data or not isinstance(data["custom_paths"], dict):
            data["custom_paths"] = {}
        return data
    except Exception:
        return {"custom_paths": {}}


def save_user_config(config: Dict[str, Any]) -> None:
    """Guarda la configuracion persistente del usuario en config.json."""
    cfg_path = _get_config_file_path()
    cfg_path.parent.mkdir(parents=True, exist_ok=True)
    cfg_path.write_text(json.dumps(config, indent=2, ensure_ascii=False), encoding="utf-8")


def resolve_binary_candidate(raw_path: Optional[str], exe_names: List[str]) -> Optional[str]:
    """
    Resuelve una ruta proporcionada por el usuario o registro:
    - Si apunta directamente a un archivo existente, lo retorna.
    - Si apunta a una carpeta, busca dentro los nombres de ejecutables indicados.
    """
    if not raw_path:
        return None
    cleaned = raw_path.strip().strip('"').strip("'")
    if not cleaned:
        return None

    p = Path(cleaned)
    try:
        if p.is_file():
            return str(p.resolve())
        if p.is_dir():
            subdirs = [
                p,
                p / "program",
                p / "bin",
                p / "Tesseract-OCR",
                p / "App" / "libreoffice" / "program",
                p / "root" / "Office16",
                p / "Office16",
            ]
            for sub in subdirs:
                for exe_name in exe_names:
                    candidate = sub / exe_name
                    if candidate.is_file():
                        return str(candidate.resolve())
    except OSError:
        return None
    return None


def set_custom_binary_path(module: str, path: Optional[str]) -> None:
    """Actualiza o elimina la ruta personalizada de un modulo ('ocr' | 'tesseract' | 'word_to_pdf')."""
    cfg = load_user_config()
    custom_paths = cfg.setdefault("custom_paths", {})
    cleaned = (path or "").strip()

    if module in ("ocr", "tesseract"):
        if cleaned:
            custom_paths["tesseract"] = cleaned
            custom_paths["ocr"] = cleaned
        else:
            custom_paths.pop("tesseract", None)
            custom_paths.pop("ocr", None)
    elif module in ("word_to_pdf", "soffice", "msword"):
        if cleaned:
            custom_paths["word_to_pdf"] = cleaned
        else:
            custom_paths.pop("word_to_pdf", None)
    else:
        if cleaned:
            custom_paths[module] = cleaned
        else:
            custom_paths.pop(module, None)

    save_user_config(cfg)
    clear_binaries_cache()


def _candidate_roots() -> List[Path]:
    """Retorna directorios raiz candidatos para buscar binarios embebidos (bundle/portable)."""
    roots: List[Path] = []
    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        roots.append(Path(meipass))
    if sys.executable:
        roots.append(Path(sys.executable).resolve().parent)
    roots.append(settings.USER_DATA_DIR)
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


def _query_windows_registry_paths(subkeys: List[Tuple[str, Optional[str]]], exe_names: List[str]) -> Optional[str]:
    if sys.platform != "win32":
        return None
    try:
        import winreg
    except ImportError:
        return None

    hives = [winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER]
    for hive in hives:
        for subkey, value_name in subkeys:
            try:
                with winreg.OpenKey(hive, subkey) as key:
                    val, _ = winreg.QueryValueEx(key, value_name or "")
                    if isinstance(val, str) and val.strip():
                        resolved = resolve_binary_candidate(val, exe_names)
                        if resolved:
                            return resolved
            except OSError:
                continue
    return None


def _detect_tesseract_with_source() -> Tuple[Optional[str], str]:
    tess_exes = ["tesseract.exe", "tesseract"]
    cfg = load_user_config()
    custom_raw = cfg.get("custom_paths", {}).get("tesseract") or cfg.get("custom_paths", {}).get("ocr")
    custom_resolved = resolve_binary_candidate(custom_raw, tess_exes)
    if custom_resolved:
        return custom_resolved, "custom"

    # 1. Directorio de usuario (%LOCALAPPDATA%\OpenPDF\bin\Tesseract-OCR) y candidate_roots
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
                return str(candidate), "auto"

    # 2. PATH del sistema
    system_bin = shutil.which("tesseract")
    if system_bin and os.path.isfile(system_bin):
        return system_bin, "auto"

    # 3. Registro de Windows
    reg_hit = _query_windows_registry_paths(
        [
            (r"SOFTWARE\Tesseract-OCR", "InstallDir"),
            (r"SOFTWARE\Tesseract-OCR", "Path"),
            (r"SOFTWARE\WOW6432Node\Tesseract-OCR", "InstallDir"),
            (r"SOFTWARE\WOW6432Node\Tesseract-OCR", "Path"),
            (r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\tesseract.exe", None),
        ],
        tess_exes,
    )
    if reg_hit:
        return reg_hit, "auto"

    # 4. Rutas de gestores de paquetes (WinGet, Scoop, Chocolatey) y Program Files
    windows_paths: List[str] = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\ProgramData\chocolatey\bin\tesseract.exe",
    ]
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        windows_paths.append(os.path.join(local_app_data, "Programs", "Tesseract-OCR", "tesseract.exe"))
        winget_pattern = os.path.join(local_app_data, "Microsoft", "WinGet", "Packages", "*Tesseract*", "**", "tesseract.exe")
        windows_paths.extend(glob.glob(winget_pattern, recursive=True))

    user_profile = os.environ.get("USERPROFILE") or str(Path.home())
    if user_profile:
        windows_paths.append(os.path.join(user_profile, "scoop", "apps", "tesseract", "current", "tesseract.exe"))

    for path in windows_paths:
        if os.path.isfile(path):
            return path, "auto"

    return None, "auto"


@lru_cache(maxsize=1)
def find_tesseract() -> Optional[str]:
    """Detecta el binario de Tesseract-OCR respetando configuracion personalizada y rutas de sistema."""
    path, _ = _detect_tesseract_with_source()
    return path


def get_tesseract_info() -> Dict[str, Any]:
    """Retorna metadatos detallados del binario Tesseract detectado."""
    path, source = _detect_tesseract_with_source()
    return {
        "available": path is not None,
        "engine": "tesseract" if path else None,
        "binary_path": path,
        "source": source,
    }


def get_effective_tessdata_dir(tess_path: Optional[str] = None) -> Optional[str]:
    """
    Si el directorio de usuario USER_TESSDATA_DIR contiene archivos .traineddata,
    sincroniza en el los .traineddata del directorio original de Tesseract que falten
    (como eng.traineddata u osd.traineddata) y retorna USER_TESSDATA_DIR.
    """
    user_dir = _get_user_tessdata_dir()
    user_has_models = user_dir.is_dir() and any(user_dir.glob("*.traineddata"))

    resolved_tess = tess_path or find_tesseract()
    system_tessdata: Optional[Path] = None
    if resolved_tess:
        candidate_dir = Path(resolved_tess).resolve().parent / "tessdata"
        if candidate_dir.is_dir():
            system_tessdata = candidate_dir

    if user_has_models:
        if system_tessdata:
            for model_file in system_tessdata.glob("*.traineddata"):
                target = user_dir / model_file.name
                if not target.exists():
                    try:
                        shutil.copy2(model_file, target)
                    except OSError:
                        pass
        return str(user_dir)

    if system_tessdata and any(system_tessdata.glob("*.traineddata")):
        return str(system_tessdata)

    return None


@lru_cache(maxsize=1)
def find_soffice() -> Optional[str]:
    """Detecta el binario de LibreOffice (soffice)."""
    soffice_exes = ["soffice.exe", "soffice", "libreoffice"]
    cfg = load_user_config()
    custom_raw = cfg.get("custom_paths", {}).get("word_to_pdf")
    if custom_raw:
        resolved = resolve_binary_candidate(custom_raw, soffice_exes)
        if resolved and Path(resolved).name.lower().startswith(("soffice", "libreoffice")):
            return resolved

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

    system_bin = shutil.which("soffice") or shutil.which("libreoffice")
    if system_bin and os.path.isfile(system_bin):
        return system_bin

    reg_hit = _query_windows_registry_paths(
        [
            (r"SOFTWARE\LibreOffice\UNO\InstallPath", None),
            (r"SOFTWARE\WOW6432Node\LibreOffice\UNO\InstallPath", None),
            (r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\soffice.exe", None),
        ],
        soffice_exes,
    )
    if reg_hit:
        return reg_hit

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
def find_msword() -> Optional[str]:
    """Detecta Microsoft Word (WINWORD.EXE) en Windows como motor alternativo para Word a PDF."""
    word_exes = ["WINWORD.EXE", "winword.exe"]
    cfg = load_user_config()
    custom_raw = cfg.get("custom_paths", {}).get("word_to_pdf")
    if custom_raw:
        resolved = resolve_binary_candidate(custom_raw, word_exes)
        if resolved and Path(resolved).name.lower() == "winword.exe":
            return resolved

    reg_hit = _query_windows_registry_paths(
        [
            (r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Winword.exe", None),
            (r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\Winword.exe", None),
        ],
        word_exes,
    )
    if reg_hit:
        return reg_hit

    office_paths = [
        r"C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE",
        r"C:\Program Files (x86)\Microsoft Office\root\Office16\WINWORD.EXE",
        r"C:\Program Files\Microsoft Office\Office16\WINWORD.EXE",
        r"C:\Program Files (x86)\Microsoft Office\Office16\WINWORD.EXE",
        r"C:\Program Files\Microsoft Office\root\Office15\WINWORD.EXE",
        r"C:\Program Files (x86)\Microsoft Office\root\Office15\WINWORD.EXE",
    ]
    for path in office_paths:
        if os.path.isfile(path):
            return path

    which_word = shutil.which("winword")
    if which_word and os.path.isfile(which_word):
        return which_word

    return None


def find_word_converter() -> Tuple[Optional[str], Optional[str], str]:
    """
    Retorna (binary_path, engine_type, source) para conversion de Word a PDF.
    engine_type: 'libreoffice' | 'msword' | None
    source: 'custom' | 'auto'
    """
    cfg = load_user_config()
    custom_raw = cfg.get("custom_paths", {}).get("word_to_pdf")
    if custom_raw:
        resolved = resolve_binary_candidate(
            custom_raw, ["soffice.exe", "soffice", "libreoffice", "WINWORD.EXE", "winword.exe"]
        )
        if resolved:
            lower_name = Path(resolved).name.lower()
            if "winword" in lower_name:
                return resolved, "msword", "custom"
            return resolved, "libreoffice", "custom"

    soffice = find_soffice()
    if soffice:
        return soffice, "libreoffice", "auto"

    msword = find_msword()
    if msword:
        return msword, "msword", "auto"

    return None, None, "auto"


@lru_cache(maxsize=1)
def find_winget() -> Optional[str]:
    """Detecta el gestor de paquetes oficial de Windows (winget.exe)."""
    which_wg = shutil.which("winget")
    if which_wg and os.path.isfile(which_wg):
        return which_wg
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        candidate = os.path.join(local_app_data, "Microsoft", "WindowsApps", "winget.exe")
        if os.path.isfile(candidate):
            return candidate
    return None


@lru_cache(maxsize=1)
def get_ocr_languages() -> List[str]:
    """Retorna la lista de idiomas instalados en Tesseract (o lista vacia si no esta disponible)."""
    tess_path = find_tesseract()
    if not tess_path:
        return []

    pytesseract.pytesseract.tesseract_cmd = tess_path
    tessdata_dir = get_effective_tessdata_dir(tess_path)
    discovered: set[str] = set()

    # 1. Escanear modelos .traineddata directamente en tessdata_dir si existe
    if tessdata_dir and os.path.isdir(tessdata_dir):
        for entry in Path(tessdata_dir).glob("*.traineddata"):
            stem = entry.stem.strip()
            if stem and stem != "osd":
                discovered.add(stem)

    # 2. Consultar tesseract --list-langs sin abrir ventana de consola en Windows
    cmd = [tess_path]
    if tessdata_dir:
        cmd.extend(["--tessdata-dir", tessdata_dir])
    cmd.append("--list-langs")

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        if proc.returncode == 0 and proc.stdout:
            for line in proc.stdout.splitlines():
                lang = line.strip()
                if lang and not lang.lower().startswith("list of available") and lang != "osd":
                    discovered.add(lang)
    except Exception:
        try:
            cfg = f'--tessdata-dir "{tessdata_dir}"' if tessdata_dir else ""
            for lang in pytesseract.get_languages(config=cfg):
                if lang and lang != "osd":
                    discovered.add(lang)
        except Exception:
            pass

    return sorted(discovered)


def clear_binaries_cache() -> None:
    """Limpia la cache de deteccion de binarios."""
    find_tesseract.cache_clear()
    find_soffice.cache_clear()
    find_msword.cache_clear()
    find_winget.cache_clear()
    get_ocr_languages.cache_clear()
