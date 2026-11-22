import json
import os
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx
import psutil
from packaging.version import Version, InvalidVersion

from app.core.config import settings
from app.core.exceptions import BusinessRuleError, PDFProcessingError
from app.services.desktop_service import get_desktop_config
from app.utils.binaries import (
    _get_user_tessdata_dir,
    clear_binaries_cache,
    find_ffmpeg,
    find_ffprobe,
    find_msword,
    find_soffice,
    find_tesseract,
    find_winget,
    find_word_converter,
    find_yt_dlp,
    get_ai_venv_dir,
    get_ai_venv_python,
    get_effective_tessdata_dir,
    get_ffmpeg_info,
    get_ocr_languages,
    get_rembg_info,
    get_tesseract_info,
    get_whisper_info,
    get_yt_dlp_info,
    resolve_binary_candidate,
    set_custom_binary_path,
)

GITHUB_LATEST_RELEASE_API = "https://api.github.com/repos/albert-dilas/Tornio/releases/latest"
DEFAULT_RELEASES_URL = "https://github.com/albert-dilas/Tornio/releases"
TESSDATA_FAST_BASE_URL = "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main"
REMBG_U2NETP_URL = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx"
YT_DLP_WIN_URL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
YT_DLP_POSIX_URL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
UPDATE_CACHE_TTL_SECONDS = 6 * 3600  # 6 horas

ALL_MODULE_IDS = ("ocr", "word_to_pdf", "ffmpeg", "yt_dlp", "rembg_onnx", "whisper_cpu")
BINARY_MODULE_IDS = ("ocr", "word_to_pdf", "ffmpeg", "yt_dlp")
INSTALLABLE_MODULE_IDS = ("ocr", "ocr_lang_spa", "word_to_pdf", "ffmpeg", "yt_dlp", "rembg_onnx", "whisper_cpu")

_update_cache: Optional[Dict[str, Any]] = None
_update_cache_timestamp: float = 0.0

_install_states: Dict[str, Dict[str, Optional[str]]] = {
    mod_id: {"status": "idle", "message": None} for mod_id in ALL_MODULE_IDS
}


def clear_update_cache() -> None:
    """Limpia la cache en memoria de comprobacion de actualizaciones."""
    global _update_cache, _update_cache_timestamp
    _update_cache = None
    _update_cache_timestamp = 0.0


def _is_update_check_disabled() -> bool:
    flag = (
        os.environ.get("TORNIO_DISABLE_UPDATE_CHECK", "").strip()
        or os.environ.get("OPENPDF_DISABLE_UPDATE_CHECK", "").strip()
    ).lower()
    return flag in ("1", "true", "yes")


def _get_feedback_dir() -> Path:
    env_cfg = (
        os.environ.get("TORNIO_CONFIG_PATH", "").strip()
        or os.environ.get("OPENPDF_CONFIG_PATH", "").strip()
    )
    if env_cfg:
        return Path(env_cfg).parent
    return settings.USER_DATA_DIR


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


def _download_file_streaming(url: str, target_path: Path, min_bytes: int = 1024, timeout: float = 180.0) -> None:
    target_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = target_path.with_suffix(target_path.suffix + ".tmp")
    total_written = 0
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            with client.stream("GET", url, headers={"User-Agent": f"Tornio/{settings.VERSION}"}) as resp:
                resp.raise_for_status()
                with open(tmp_path, "wb") as out_f:
                    for chunk in resp.iter_bytes(chunk_size=1024 * 64):
                        if chunk:
                            out_f.write(chunk)
                            total_written += len(chunk)
        if total_written < min_bytes:
            raise RuntimeError("El archivo descargado esta incompleto o vacio.")
        tmp_path.replace(target_path)
    finally:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass


def _run_winget_install(package_id: str, timeout: int = 600) -> subprocess.CompletedProcess:
    winget_bin = find_winget() or "winget"
    return subprocess.run(
        [
            winget_bin,
            "install",
            "--id",
            package_id,
            "-e",
            "--silent",
            "--accept-package-agreements",
            "--accept-source-agreements",
            "--disable-interactivity",
        ],
        capture_output=True,
        text=True,
        timeout=timeout,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )


def _find_host_python_for_venv() -> Optional[str]:
    if not getattr(sys, "frozen", False) and sys.executable and os.path.isfile(sys.executable):
        return sys.executable
    for candidate in ("python", "python3"):
        found = shutil.which(candidate)
        if found and os.path.isfile(found):
            return found
    return None


def _run_install_module_worker(module: str) -> None:
    state_key = "ocr" if module in ("ocr", "ocr_lang_spa") else module
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
                    "status": "failed",
                    "message": "No se pudo descargar spa.traineddata. Verifica tu conexion a internet.",
                }
            return

        if module == "ocr":
            if find_tesseract() is None:
                _install_states[state_key] = {
                    "status": "installing",
                    "message": "Instalando Tesseract OCR mediante WinGet...",
                }
                proc = _run_winget_install("UB-Mannheim.TesseractOCR", timeout=600)
                clear_binaries_cache()
                if proc.returncode != 0 and find_tesseract() is None:
                    _install_states[state_key] = {
                        "status": "failed",
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
            proc = _run_winget_install("TheDocumentFoundation.LibreOffice", timeout=900)
            clear_binaries_cache()
            if proc.returncode == 0 or find_soffice() is not None or find_msword() is not None:
                _install_states[state_key] = {
                    "status": "completed",
                    "message": "Motor de conversion Word a PDF instalado correctamente.",
                }
            else:
                _install_states[state_key] = {
                    "status": "failed",
                    "message": "WinGet no pudo completar la instalacion de LibreOffice.",
                }
            return

        if module == "ffmpeg":
            _install_states[state_key] = {
                "status": "installing",
                "message": "Instalando FFmpeg mediante WinGet (Gyan.FFmpeg)...",
            }
            proc = _run_winget_install("Gyan.FFmpeg", timeout=900)
            clear_binaries_cache()
            if proc.returncode == 0 or find_ffmpeg() is not None:
                _install_states[state_key] = {
                    "status": "completed",
                    "message": "Motor FFmpeg instalado correctamente.",
                }
            else:
                _install_states[state_key] = {
                    "status": "failed",
                    "message": "WinGet no pudo completar la instalacion de FFmpeg.",
                }
            return

        if module == "yt_dlp":
            _install_states[state_key] = {
                "status": "installing",
                "message": "Instalando yt-dlp mediante WinGet...",
            }
            installed = False
            if find_winget() is not None:
                try:
                    proc = _run_winget_install("yt-dlp.yt-dlp", timeout=600)
                    clear_binaries_cache()
                    installed = proc.returncode == 0 or find_yt_dlp() is not None
                except Exception:
                    installed = False

            if not installed:
                _install_states[state_key] = {
                    "status": "installing",
                    "message": "Descargando binario oficial de yt-dlp en carpeta local de Tornio...",
                }
                exe_name = "yt-dlp.exe" if sys.platform == "win32" else "yt-dlp"
                dl_url = YT_DLP_WIN_URL if sys.platform == "win32" else YT_DLP_POSIX_URL
                target_bin = settings.USER_BIN_DIR / exe_name
                _download_file_streaming(dl_url, target_bin, min_bytes=500_000, timeout=180.0)
                if sys.platform != "win32":
                    os.chmod(target_bin, 0o755)
                clear_binaries_cache()

            if find_yt_dlp() is not None:
                _install_states[state_key] = {
                    "status": "completed",
                    "message": "Motor yt-dlp instalado y listo.",
                }
            else:
                _install_states[state_key] = {
                    "status": "failed",
                    "message": "No se pudo completar la instalacion de yt-dlp.",
                }
            return

        if module == "rembg_onnx":
            _install_states[state_key] = {
                "status": "installing",
                "message": "Descargando modelo ONNX u2netp.onnx en almacenamiento local...",
            }
            model_target = settings.USER_MODELS_DIR / "u2netp.onnx"
            _download_file_streaming(REMBG_U2NETP_URL, model_target, min_bytes=100_000, timeout=240.0)
            clear_binaries_cache()
            rembg_info = get_rembg_info()
            if rembg_info["available"]:
                _install_states[state_key] = {
                    "status": "completed",
                    "message": "Modelo u2netp.onnx listo para eliminacion de fondo local.",
                }
            else:
                _install_states[state_key] = {
                    "status": "failed",
                    "message": "Modelo descargado, pero onnxruntime no esta disponible en el entorno Python.",
                }
            return

        if module == "whisper_cpu":
            host_python = _find_host_python_for_venv()
            if not host_python:
                _install_states[state_key] = {
                    "status": "failed",
                    "message": "No se encontro un interprete Python local para crear el entorno de Whisper.",
                }
                return

            venv_dir = get_ai_venv_dir()
            venv_python = get_ai_venv_python()
            if not venv_python.is_file():
                _install_states[state_key] = {
                    "status": "installing",
                    "message": "Creando entorno Python aislado para Whisper CPU...",
                }
                venv_dir.parent.mkdir(parents=True, exist_ok=True)
                subprocess.run(
                    [host_python, "-m", "venv", str(venv_dir)],
                    check=True,
                    capture_output=True,
                    text=True,
                    timeout=180,
                    creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
                )

            _install_states[state_key] = {
                "status": "installing",
                "message": "Instalando faster-whisper en entorno aislado...",
            }
            subprocess.run(
                [str(venv_python), "-m", "pip", "install", "--upgrade", "faster-whisper"],
                check=True,
                capture_output=True,
                text=True,
                timeout=900,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
            clear_binaries_cache()
            if get_whisper_info()["available"]:
                _install_states[state_key] = {
                    "status": "completed",
                    "message": "Motor Whisper CPU (faster-whisper) instalado correctamente.",
                }
            else:
                _install_states[state_key] = {
                    "status": "failed",
                    "message": "La instalacion termino pero faster-whisper no respondio en el entorno.",
                }
    except Exception as exc:
        _install_states[state_key] = {
            "status": "failed",
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

        ffmpeg_info = get_ffmpeg_info()
        yt_dlp_info = get_yt_dlp_info()
        rembg_info = get_rembg_info()
        whisper_info = get_whisper_info()

        ffmpeg_available = bool(ffmpeg_info["available"])
        yt_dlp_available = bool(yt_dlp_info["available"])
        rembg_available = bool(rembg_info["available"])
        whisper_available = bool(whisper_info["available"])

        ocr_state = _install_states.get("ocr", {"status": "idle", "message": None})
        word_state = _install_states.get("word_to_pdf", {"status": "idle", "message": None})
        ffmpeg_state = _install_states.get("ffmpeg", {"status": "idle", "message": None})
        yt_dlp_state = _install_states.get("yt_dlp", {"status": "idle", "message": None})
        rembg_state = _install_states.get("rembg_onnx", {"status": "idle", "message": None})
        whisper_state = _install_states.get("whisper_cpu", {"status": "idle", "message": None})

        try:
            temp_files_count = len([
                f for f in os.listdir(settings.TEMP_DIR)
                if os.path.isfile(os.path.join(settings.TEMP_DIR, f))
            ])
        except Exception:
            temp_files_count = 0

        try:
            cpu_percent = float(psutil.cpu_percent(interval=None))
            memory_used_percent = float(psutil.virtual_memory().percent)
        except Exception:
            cpu_percent = 0.0
            memory_used_percent = 0.0

        return {
            "version": settings.VERSION,
            "project_name": settings.PROJECT_NAME,
            "capabilities": {
                "ocr": ocr_available,
                "word_to_pdf": word_to_pdf_available,
                "ffmpeg": ffmpeg_available,
                "yt_dlp": yt_dlp_available,
                "rembg_onnx": rembg_available,
                "whisper_cpu": whisper_available,
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
                "ffmpeg": {
                    "available": ffmpeg_available,
                    "engine": ffmpeg_info.get("engine"),
                    "binary_path": ffmpeg_info.get("binary_path"),
                    "ffprobe_path": ffmpeg_info.get("ffprobe_path"),
                    "source": ffmpeg_info.get("source", "auto"),
                    "install_status": ffmpeg_state.get("status") or "idle",
                    "install_message": ffmpeg_state.get("message"),
                },
                "yt_dlp": {
                    "available": yt_dlp_available,
                    "engine": yt_dlp_info.get("engine"),
                    "binary_path": yt_dlp_info.get("binary_path"),
                    "source": yt_dlp_info.get("source", "auto"),
                    "install_status": yt_dlp_state.get("status") or "idle",
                    "install_message": yt_dlp_state.get("message"),
                },
                "rembg_onnx": {
                    "available": rembg_available,
                    "engine": rembg_info.get("engine"),
                    "onnxruntime_installed": rembg_info.get("onnxruntime_installed", False),
                    "model_path": rembg_info.get("model_path"),
                    "binary_path": rembg_info.get("binary_path"),
                    "source": rembg_info.get("source", "auto"),
                    "install_status": rembg_state.get("status") or "idle",
                    "install_message": rembg_state.get("message"),
                },
                "whisper_cpu": {
                    "available": whisper_available,
                    "engine": whisper_info.get("engine"),
                    "binary_path": whisper_info.get("binary_path"),
                    "source": whisper_info.get("source", "auto"),
                    "install_status": whisper_state.get("status") or "idle",
                    "install_message": whisper_state.get("message"),
                },
                "winget_available": find_winget() is not None,
            },
            "system": {
                "cpu_count": os.cpu_count() or 1,
                "cpu_percent": cpu_percent,
                "memory_used_percent": memory_used_percent,
                "temp_files_count": temp_files_count,
            },
            "desktop": get_desktop_config(),
        }

    @staticmethod
    def detect_modules() -> Dict[str, Any]:
        clear_binaries_cache()
        tess_path = find_tesseract()
        if tess_path:
            langs = get_ocr_languages()
            if "spa" not in langs and not _is_update_check_disabled():
                download_tessdata_languages(["spa", "eng"], timeout=8.0)
                clear_binaries_cache()
        return SystemService.get_status()

    @staticmethod
    def configure_module(module: str, path: str) -> Dict[str, Any]:
        mod = (module or "").strip().lower()
        if mod not in ALL_MODULE_IDS:
            raise BusinessRuleError(
                f"Modulo invalido. Valores permitidos: {', '.join(ALL_MODULE_IDS)}."
            )

        cleaned_path = (path or "").strip()
        if not cleaned_path:
            set_custom_binary_path(mod, None)
            return SystemService.get_status()

        candidates_map = {
            "ocr": ["tesseract.exe", "tesseract"],
            "word_to_pdf": ["soffice.exe", "soffice", "libreoffice", "WINWORD.EXE", "winword.exe"],
            "ffmpeg": ["ffmpeg.exe", "ffmpeg"],
            "yt_dlp": ["yt-dlp.exe", "yt-dlp"],
            "rembg_onnx": ["u2netp.onnx"],
            "whisper_cpu": ["python.exe", "python"],
        }
        resolved = resolve_binary_candidate(cleaned_path, candidates_map[mod])

        if not resolved or not os.path.isfile(resolved):
            raise BusinessRuleError(
                "No se encontro un archivo valido en la ruta indicada. "
                "Selecciona el archivo ejecutable o carpeta de instalacion del modulo."
            )

        ext = Path(resolved).suffix.lower()
        if mod == "rembg_onnx":
            if ext != ".onnx":
                raise BusinessRuleError("El modelo de rembg_onnx debe ser un archivo .onnx valido.")
        else:
            if ext in (".pdf", ".docx", ".doc", ".txt", ".png", ".jpg", ".jpeg", ".json", ".onnx"):
                raise BusinessRuleError("El archivo seleccionado no es un ejecutable valido.")

        set_custom_binary_path(mod, resolved)
        return SystemService.get_status()

    @staticmethod
    def pick_module_binary(module: str) -> Dict[str, Any]:
        mod = (module or "").strip().lower()
        if mod not in BINARY_MODULE_IDS:
            raise BusinessRuleError(
                f"Modulo invalido para seleccion de binario. Usa uno de: {', '.join(BINARY_MODULE_IDS)}."
            )

        dialog_specs = {
            "ocr": (
                "Seleccionar ejecutable de Tesseract OCR (tesseract.exe)",
                "Tesseract OCR (tesseract.exe)|tesseract.exe|Ejecutables (*.exe)|*.exe",
            ),
            "word_to_pdf": (
                "Seleccionar LibreOffice (soffice.exe) o Microsoft Word (WINWORD.EXE)",
                "Motores Word a PDF (soffice.exe;WINWORD.EXE)|soffice.exe;WINWORD.EXE|Ejecutables (*.exe)|*.exe",
            ),
            "ffmpeg": (
                "Seleccionar ejecutable de FFmpeg (ffmpeg.exe)",
                "FFmpeg (ffmpeg.exe)|ffmpeg.exe|Ejecutables (*.exe)|*.exe",
            ),
            "yt_dlp": (
                "Seleccionar ejecutable de yt-dlp (yt-dlp.exe)",
                "yt-dlp (yt-dlp.exe)|yt-dlp.exe|Ejecutables (*.exe)|*.exe",
            ),
        }
        title, file_filter = dialog_specs[mod]

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
        if mod not in INSTALLABLE_MODULE_IDS:
            raise BusinessRuleError(
                f"Modulo invalido. Usa uno de: {', '.join(INSTALLABLE_MODULE_IDS)}."
            )

        state_key = "ocr" if mod in ("ocr", "ocr_lang_spa") else mod
        _install_states[state_key] = {
            "status": "installing",
            "message": "Iniciando instalacion automatica...",
        }

        worker = threading.Thread(target=_run_install_module_worker, args=(mod,), daemon=True)
        worker.start()

        return {"started": True, "module": mod, **SystemService.get_status()}

    @staticmethod
    async def check_updates(force: bool = False) -> Dict[str, Any]:
        global _update_cache, _update_cache_timestamp

        fallback = {
            "current": settings.VERSION,
            "latest": None,
            "update_available": False,
            "online": False,
            "url": DEFAULT_RELEASES_URL,
        }

        if _is_update_check_disabled():
            return fallback

        desktop_cfg = get_desktop_config()
        if not force and desktop_cfg.get("update_mode") == "manual":
            return fallback

        now = time.time()
        if not force and _update_cache is not None and (now - _update_cache_timestamp) < UPDATE_CACHE_TTL_SECONDS:
            return dict(_update_cache)

        try:
            headers = {
                "Accept": "application/vnd.github+json",
                "User-Agent": f"Tornio/{settings.VERSION}",
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
                body = str(data.get("body") or "").strip()
                name = str(data.get("name") or "").strip()

                installer_url = None
                portable_url = None
                checksums_url = None
                asset_name = None
                assets = data.get("assets")
                if isinstance(assets, list):
                    for asset in assets:
                        if not isinstance(asset, dict):
                            continue
                        raw_name = str(asset.get("name") or "").strip()
                        fname = raw_name.lower()
                        dl = asset.get("browser_download_url")
                        if not dl:
                            continue
                        if fname == "sha256sums.txt":
                            checksums_url = dl
                        elif fname.endswith(".exe"):
                            if "setup" in fname and installer_url is None:
                                installer_url = dl
                                asset_name = raw_name
                            elif portable_url is None:
                                portable_url = dl
                                if asset_name is None:
                                    asset_name = raw_name

                download_url = installer_url or portable_url

                result = {
                    "current": settings.VERSION,
                    "latest": latest_clean,
                    "update_available": bool(update_available),
                    "online": True,
                    "url": html_url,
                }
                if body:
                    result["notes"] = body
                if download_url:
                    result["download_url"] = download_url
                if installer_url:
                    result["installer_url"] = installer_url
                if portable_url:
                    result["portable_url"] = portable_url
                if checksums_url:
                    result["checksums_url"] = checksums_url
                if asset_name:
                    result["asset_name"] = asset_name
                if name:
                    result["release_name"] = name

                _update_cache = dict(result)
                _update_cache_timestamp = time.time()
                return result
        except (httpx.HTTPError, InvalidVersion, ValueError, KeyError, Exception):
            return fallback

    @staticmethod
    def save_feedback(payload: Dict[str, Any]) -> Dict[str, Any]:
        feedback_dir = _get_feedback_dir()
        try:
            feedback_dir.mkdir(parents=True, exist_ok=True)
            feedback_file = feedback_dir / "feedback_log.json"

            entries: List[Dict[str, Any]] = []
            if feedback_file.is_file():
                try:
                    raw_content = feedback_file.read_text(encoding="utf-8")
                    loaded = json.loads(raw_content)
                    if isinstance(loaded, list):
                        entries = loaded
                except Exception:
                    entries = []

            entry = {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                **payload,
            }
            entries.append(entry)

            feedback_file.write_text(
                json.dumps(entries, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
            return {
                "status": "success",
                "message": "Comentario registrado correctamente en el sistema local.",
                "stored_locally": True,
            }
        except Exception as e:
            raise PDFProcessingError(f"No fue posible guardar el comentario localmente: {str(e)}")


def get_system_service() -> SystemService:
    return SystemService()
