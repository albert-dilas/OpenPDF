import os
import subprocess
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx
from packaging.version import Version, InvalidVersion

from app.core.config import settings
from app.core.exceptions import BusinessRuleError
from app.utils.binaries import (
    _get_user_tessdata_dir,
    clear_binaries_cache,
    find_msword,
    find_soffice,
    find_tesseract,
    find_winget,
    find_word_converter,
    get_effective_tessdata_dir,
    get_ocr_languages,
    get_tesseract_info,
    resolve_binary_candidate,
    set_custom_binary_path,
)

GITHUB_LATEST_RELEASE_API = "https://api.github.com/repos/albert-dilas/OpenPDF/releases/latest"
DEFAULT_RELEASES_URL = "https://github.com/albert-dilas/OpenPDF/releases"
TESSDATA_FAST_BASE_URL = "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main"
UPDATE_CACHE_TTL_SECONDS = 6 * 3600  # 6 horas

_update_cache: Optional[Dict[str, Any]] = None
_update_cache_timestamp: float = 0.0

_install_states: Dict[str, Dict[str, Optional[str]]] = {
    "ocr": {"status": "idle", "message": None},
    "word_to_pdf": {"status": "idle", "message": None},
}


def clear_update_cache() -> None:
    """Limpia la cache en memoria de comprobacion de actualizaciones."""
    global _update_cache, _update_cache_timestamp
    _update_cache = None
    _update_cache_timestamp = 0.0


def download_tessdata_languages(langs: List[str], timeout: float = 20.0) -> bool:
    """Descarga archivos .traineddata desde tessdata_fast al directorio de usuario USER_TESSDATA_DIR."""
    tess_dir = _get_user_tessdata_dir()
    tess_dir.mkdir(parents=True, exist_ok=True)
    success = True

    with httpx.Client(timeout=timeout, follow_redirects=True) as client:
        for lang in langs:
            target_file = tess_dir / f"{lang}.traineddata"
            if target_file.is_file() and target_file.stat().st_size > 1024:
                continue
            url = f"{TESSDATA_FAST_BASE_URL}/{lang}.traineddata"
            try:
                resp = client.get(url)
                if resp.status_code == 200 and len(resp.content) > 1024:
                    target_file.write_bytes(resp.content)
                else:
                    success = False
            except Exception:
                success = False

    get_effective_tessdata_dir()
    clear_binaries_cache()
    return success


def _run_install_module_worker(module: str) -> None:
    state_key = "ocr" if module in ("ocr", "ocr_lang_spa") else "word_to_pdf"
    try:
        if module == "ocr_lang_spa":
            _install_states[state_key] = {
                "status": "installing",
                "message": "Descargando paquete de idioma espanol (spa.traineddata)...",
            }
            ok = download_tessdata_languages(["spa", "eng"], timeout=30.0)
            if ok:
                _install_states[state_key] = {
                    "status": "completed",
                    "message": "Paquete de idioma espanol instalado correctamente.",
                }
            else:
                _install_states[state_key] = {
                    "status": "error",
                    "message": "No se pudo descargar spa.traineddata. Verifica tu conexion a internet.",
                }
            return

        if module == "ocr":
            if find_tesseract() is None:
                _install_states[state_key] = {
                    "status": "installing",
                    "message": "Instalando Tesseract OCR mediante WinGet...",
                }
                winget_bin = find_winget() or "winget"
                proc = subprocess.run(
                    [
                        winget_bin,
                        "install",
                        "--id",
                        "UB-Mannheim.TesseractOCR",
                        "-e",
                        "--silent",
                        "--accept-package-agreements",
                        "--accept-source-agreements",
                        "--disable-interactivity",
                    ],
                    capture_output=True,
                    text=True,
                    timeout=600,
                    creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
                )
                clear_binaries_cache()
                if proc.returncode != 0 and find_tesseract() is None:
                    _install_states[state_key] = {
                        "status": "error",
                        "message": "WinGet no pudo completar la instalacion de Tesseract OCR.",
                    }
                    return

            _install_states[state_key] = {
                "status": "installing",
                "message": "Configurando modelos de idioma OCR (spa + eng)...",
            }
            download_tessdata_languages(["spa", "eng"], timeout=30.0)
            clear_binaries_cache()
            _install_states[state_key] = {
                "status": "completed",
                "message": "Tesseract OCR e idioma espanol listos.",
            }
            return

        if module == "word_to_pdf":
            _install_states[state_key] = {
                "status": "installing",
                "message": "Instalando LibreOffice mediante WinGet...",
            }
            winget_bin = find_winget() or "winget"
            proc = subprocess.run(
                [
                    winget_bin,
                    "install",
                    "--id",
                    "TheDocumentFoundation.LibreOffice",
                    "-e",
                    "--silent",
                    "--accept-package-agreements",
                    "--accept-source-agreements",
                    "--disable-interactivity",
                ],
                capture_output=True,
                text=True,
                timeout=900,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
            clear_binaries_cache()
            if proc.returncode == 0 or find_soffice() is not None or find_msword() is not None:
                _install_states[state_key] = {
                    "status": "completed",
                    "message": "Motor de conversion Word a PDF instalado correctamente.",
                }
            else:
                _install_states[state_key] = {
                    "status": "error",
                    "message": "WinGet no pudo completar la instalacion de LibreOffice.",
                }
    except Exception as exc:
        _install_states[state_key] = {
            "status": "error",
            "message": f"Error durante la instalacion: {str(exc)}",
        }


class SystemService:
    @staticmethod
    def get_status() -> Dict[str, Any]:
        tess_info = get_tesseract_info()
        tess_path = find_tesseract() or tess_info.get("binary_path")
        ocr_available = tess_path is not None
        ocr_languages = get_ocr_languages() if ocr_available else []
        has_spanish = "spa" in ocr_languages

        word_bin, word_engine, word_source = find_word_converter()
        soffice_bin = find_soffice()
        msword_bin = find_msword()
        if word_bin is None:
            if soffice_bin:
                word_bin = soffice_bin
                word_engine = "libreoffice"
            elif msword_bin:
                word_bin = msword_bin
                word_engine = "msword"
        word_to_pdf_available = word_bin is not None

        ocr_state = _install_states.get("ocr", {"status": "idle", "message": None})
        word_state = _install_states.get("word_to_pdf", {"status": "idle", "message": None})

        return {
            "version": settings.VERSION,
            "capabilities": {
                "ocr": ocr_available,
                "word_to_pdf": word_to_pdf_available,
            },
            "ocr_languages": ocr_languages,
            "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
            "modules": {
                "ocr": {
                    "available": ocr_available,
                    "engine": "tesseract" if ocr_available else None,
                    "binary_path": tess_path,
                    "source": tess_info.get("source", "auto"),
                    "languages": ocr_languages,
                    "has_spanish": has_spanish,
                    "install_status": ocr_state.get("status") or "idle",
                    "install_message": ocr_state.get("message"),
                },
                "word_to_pdf": {
                    "available": word_to_pdf_available,
                    "engine": word_engine,
                    "binary_path": word_bin,
                    "source": word_source,
                    "install_status": word_state.get("status") or "idle",
                    "install_message": word_state.get("message"),
                },
                "winget_available": find_winget() is not None,
            },
        }

    @staticmethod
    def detect_modules() -> Dict[str, Any]:
        clear_binaries_cache()
        tess_path = find_tesseract()
        if tess_path:
            langs = get_ocr_languages()
            disable_net = os.environ.get("OPENPDF_DISABLE_UPDATE_CHECK", "").strip().lower() in (
                "1",
                "true",
                "yes",
            )
            if "spa" not in langs and not disable_net:
                download_tessdata_languages(["spa", "eng"], timeout=8.0)
                clear_binaries_cache()
        return SystemService.get_status()

    @staticmethod
    def configure_module(module: str, path: str) -> Dict[str, Any]:
        mod = (module or "").strip().lower()
        if mod not in ("ocr", "word_to_pdf"):
            raise BusinessRuleError("Modulo invalido. Debe ser 'ocr' o 'word_to_pdf'.")

        cleaned_path = (path or "").strip()
        if not cleaned_path:
            set_custom_binary_path(mod, None)
            return SystemService.get_status()

        if mod == "ocr":
            resolved = resolve_binary_candidate(cleaned_path, ["tesseract.exe", "tesseract"])
        else:
            resolved = resolve_binary_candidate(
                cleaned_path,
                ["soffice.exe", "soffice", "libreoffice", "WINWORD.EXE", "winword.exe"],
            )

        if not resolved or not os.path.isfile(resolved):
            raise BusinessRuleError(
                "No se encontro un ejecutable valido en la ruta indicada. "
                "Selecciona el archivo .exe o la carpeta de instalacion del programa."
            )

        ext = Path(resolved).suffix.lower()
        if ext in (".pdf", ".docx", ".doc", ".txt", ".png", ".jpg", ".jpeg", ".json"):
            raise BusinessRuleError(
                "El archivo seleccionado no es un ejecutable valido."
            )

        set_custom_binary_path(mod, resolved)
        return SystemService.get_status()

    @staticmethod
    def pick_module_binary(module: str) -> Dict[str, Any]:
        mod = (module or "").strip().lower()
        if mod not in ("ocr", "word_to_pdf"):
            raise BusinessRuleError("Modulo invalido. Debe ser 'ocr' o 'word_to_pdf'.")

        title = (
            "Seleccionar ejecutable de Tesseract OCR (tesseract.exe)"
            if mod == "ocr"
            else "Seleccionar LibreOffice (soffice.exe) o Microsoft Word (WINWORD.EXE)"
        )
        file_filter = (
            "Tesseract OCR (tesseract.exe)|tesseract.exe|Ejecutables (*.exe)|*.exe"
            if mod == "ocr"
            else "Motores Word a PDF (soffice.exe;WINWORD.EXE)|soffice.exe;WINWORD.EXE|Ejecutables (*.exe)|*.exe"
        )

        ps_script = (
            "Add-Type -AssemblyName System.Windows.Forms; "
            "$dlg = New-Object System.Windows.Forms.OpenFileDialog; "
            f"$dlg.Title = '{title}'; "
            f"$dlg.Filter = '{file_filter}'; "
            "$dlg.Multiselect = $false; "
            "if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { "
            "  [Console]::Out.Write($dlg.FileName) "
            "}"
        )

        chosen_path: Optional[str] = None
        try:
            proc = subprocess.run(
                ["powershell", "-NoProfile", "-Sta", "-Command", ps_script],
                capture_output=True,
                text=True,
                timeout=120,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
            raw_out = (proc.stdout or "").strip()
            if raw_out:
                chosen_path = raw_out
        except Exception:
            chosen_path = None

        if chosen_path:
            status_payload = SystemService.configure_module(mod, chosen_path)
            return {"selected": True, "path": chosen_path, **status_payload}

        return {"selected": False, "path": None, **SystemService.get_status()}

    @staticmethod
    def install_module(module: str) -> Dict[str, Any]:
        mod = (module or "").strip().lower()
        if mod not in ("ocr", "word_to_pdf", "ocr_lang_spa"):
            raise BusinessRuleError(
                "Modulo invalido. Usa 'ocr', 'ocr_lang_spa' o 'word_to_pdf'."
            )

        state_key = "ocr" if mod in ("ocr", "ocr_lang_spa") else "word_to_pdf"
        _install_states[state_key] = {
            "status": "installing",
            "message": "Iniciando instalacion automatica...",
        }

        worker = threading.Thread(target=_run_install_module_worker, args=(mod,), daemon=True)
        worker.start()

        return {"started": True, "module": mod, **SystemService.get_status()}

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
