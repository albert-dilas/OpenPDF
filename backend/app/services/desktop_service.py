"""Servicios de ciclo de vida Desktop, almacenamiento local, Auto-Updater seguro (SHA-256) y cancelacion de procesos."""
from __future__ import annotations

import contextvars
import hashlib
import hmac
import io
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import threading
import time
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any, Callable, Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.core.exceptions import BusinessRuleError
from app.core.jobs import job_manager
from app.core.logging import logger
from app.utils.binaries import _get_user_tessdata_dir, load_user_config, save_user_config

CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)

ALLOWED_UPDATE_HOSTS = {
    "github.com",
    "api.github.com",
    "objects.githubusercontent.com",
    "release-assets.githubusercontent.com",
}
REDIRECT_STATUS_CODES = {301, 302, 303, 307, 308}

VALID_UPDATE_MODES = {"notify", "auto", "manual"}
VALID_SAVE_MODES = {"ask", "fixed_folder"}
LOW_DISK_THRESHOLD_BYTES = 500 * 1024 * 1024
CRITICAL_DISK_THRESHOLD_BYTES = 50 * 1024 * 1024
MIN_RECOMMENDED_DISK_BYTES = 300 * 1024 * 1024
SHA256_HEX_RE = re.compile(r"\b([a-fA-F0-9]{64})\b")
INVALID_FILENAME_CHARS_RE = re.compile(r'[<>:"/\\|?*\x00-\x1f]')

current_request_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "current_request_id", default=None
)


def _default_output_directory() -> str:
    return str((Path.home() / "Downloads" / "Tornio").resolve())


def get_effective_data_dir() -> Path:
    env_cfg = (
        os.environ.get("TORNIO_CONFIG_PATH", "").strip()
        or os.environ.get("OPENPDF_CONFIG_PATH", "").strip()
    )
    if env_cfg:
        return Path(env_cfg).resolve().parent
    return Path(settings.USER_DATA_DIR).resolve()


def _is_env_truthy(var_name: str) -> bool:
    return os.environ.get(var_name, "").strip().lower() in ("1", "true", "yes")


def _registry_sync_disabled() -> bool:
    return _is_env_truthy("TORNIO_DISABLE_REGISTRY_SYNC") or _is_env_truthy(
        "OPENPDF_DISABLE_REGISTRY_SYNC"
    )


def _default_desktop_config() -> Dict[str, Any]:
    return {
        "keep_in_background": False,
        "start_with_windows": False,
        "start_minimized": True,
        "context_menu_enabled": False,
        "update_mode": "notify",
        "save_mode": "ask",
        "default_output_dir": _default_output_directory(),
        "clean_temp_on_exit": True,
        "smart_zip_downloads": True,
    }


def _sanitize_desktop_config(raw: Any) -> Dict[str, Any]:
    defaults = _default_desktop_config()
    if not isinstance(raw, dict):
        return defaults

    update_mode = str(raw.get("update_mode") or defaults["update_mode"]).strip().lower()
    if update_mode not in VALID_UPDATE_MODES:
        update_mode = defaults["update_mode"]

    save_mode = str(raw.get("save_mode") or defaults["save_mode"]).strip().lower()
    if save_mode not in VALID_SAVE_MODES:
        save_mode = defaults["save_mode"]

    raw_dir = raw.get("default_output_dir")
    default_output_dir = (
        str(raw_dir).strip()
        if isinstance(raw_dir, str) and str(raw_dir).strip()
        else defaults["default_output_dir"]
    )

    return {
        "keep_in_background": bool(raw.get("keep_in_background", defaults["keep_in_background"])),
        "start_with_windows": bool(raw.get("start_with_windows", defaults["start_with_windows"])),
        "start_minimized": bool(raw.get("start_minimized", defaults["start_minimized"])),
        "context_menu_enabled": bool(raw.get("context_menu_enabled", defaults["context_menu_enabled"])),
        "update_mode": update_mode,
        "save_mode": save_mode,
        "default_output_dir": default_output_dir,
        "clean_temp_on_exit": bool(raw.get("clean_temp_on_exit", defaults["clean_temp_on_exit"])),
        "smart_zip_downloads": bool(raw.get("smart_zip_downloads", defaults["smart_zip_downloads"])),
    }


def get_desktop_config() -> Dict[str, Any]:
    """Lee la configuracion Desktop persistida en config.json con defaults seguros."""
    cfg = load_user_config()
    return _sanitize_desktop_config(cfg.get("desktop"))


def _resolve_registered_exe_path(explicit_exe: Optional[str] = None) -> Optional[str]:
    if explicit_exe and os.path.isfile(explicit_exe):
        return str(Path(explicit_exe).resolve())

    if getattr(sys, "frozen", False) and sys.executable and os.path.isfile(sys.executable):
        return str(Path(sys.executable).resolve())

    if sys.platform == "win32":
        try:
            import winreg

            for subkey in (r"Software\Tornio", r"Software\Tornio Project\Tornio"):
                try:
                    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, subkey) as key:
                        install_path, _ = winreg.QueryValueEx(key, "InstallPath")
                        if isinstance(install_path, str) and install_path.strip():
                            candidate = Path(install_path.strip()) / "Tornio.exe"
                            if candidate.is_file():
                                return str(candidate.resolve())
                except OSError:
                    continue
        except ImportError:
            pass
    return None


def sync_windows_autostart(
    enabled: bool,
    start_minimized: bool = True,
    exe_path: Optional[str] = None,
) -> bool:
    """Sincroniza HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Tornio sin requerir admin."""
    if sys.platform != "win32" or _registry_sync_disabled():
        return False

    try:
        import winreg
    except ImportError:
        return False

    run_subkey = r"Software\Microsoft\Windows\CurrentVersion\Run"
    value_name = "Tornio"
    try:
        if not enabled:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, run_subkey, 0, winreg.KEY_SET_VALUE) as key:
                try:
                    winreg.DeleteValue(key, value_name)
                except FileNotFoundError:
                    pass
            return True

        resolved_exe = _resolve_registered_exe_path(exe_path)
        if not resolved_exe:
            return False

        cmd = f'"{resolved_exe}" --background' if start_minimized else f'"{resolved_exe}"'
        with winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, run_subkey, 0, winreg.KEY_SET_VALUE) as key:
            winreg.SetValueEx(key, value_name, 0, winreg.REG_SZ, cmd)
        return True
    except OSError as exc:
        logger.warning("No se pudo sincronizar autostart en HKCU: %s", exc)
        return False


def sync_windows_context_menu(enabled: bool, exe_path: Optional[str] = None) -> bool:
    """Sincroniza 'Abrir con Tornio' en HKCU\\Software\\Classes\\*\\shell\\Tornio sin admin."""
    if sys.platform != "win32" or _registry_sync_disabled():
        return False

    try:
        import winreg
    except ImportError:
        return False

    shell_subkey = r"Software\Classes\*\shell\Tornio"
    cmd_subkey = r"Software\Classes\*\shell\Tornio\command"
    try:
        if not enabled:
            for subkey in (cmd_subkey, shell_subkey):
                try:
                    winreg.DeleteKey(winreg.HKEY_CURRENT_USER, subkey)
                except FileNotFoundError:
                    pass
            return True

        resolved_exe = _resolve_registered_exe_path(exe_path)
        if not resolved_exe:
            return False

        icon_path = str(Path(resolved_exe).parent / "tornio.ico")
        icon_value = f"{icon_path},0" if os.path.isfile(icon_path) else f"{resolved_exe},0"

        with winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, shell_subkey, 0, winreg.KEY_SET_VALUE) as key:
            winreg.SetValueEx(key, "", 0, winreg.REG_SZ, "Abrir con Tornio")
            winreg.SetValueEx(key, "Icon", 0, winreg.REG_SZ, icon_value)

        with winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, cmd_subkey, 0, winreg.KEY_SET_VALUE) as key:
            winreg.SetValueEx(key, "", 0, winreg.REG_SZ, f'"{resolved_exe}" "%1"')
        return True
    except OSError as exc:
        logger.warning("No se pudo sincronizar el menu contextual en HKCU: %s", exc)
        return False


def update_desktop_config(patch: Dict[str, Any]) -> Dict[str, Any]:
    """Valida, persiste y sincroniza las preferencias desktop en config.json y Windows HKCU."""
    if not isinstance(patch, dict):
        raise BusinessRuleError("Carga de configuracion desktop invalida.")

    if "update_mode" in patch:
        mode = str(patch["update_mode"]).strip().lower()
        if mode not in VALID_UPDATE_MODES:
            raise BusinessRuleError(
                f"update_mode invalido. Valores permitidos: {', '.join(sorted(VALID_UPDATE_MODES))}."
            )

    if "save_mode" in patch:
        sm = str(patch["save_mode"]).strip().lower()
        if sm not in VALID_SAVE_MODES:
            raise BusinessRuleError(
                f"save_mode invalido. Valores permitidos: {', '.join(sorted(VALID_SAVE_MODES))}."
            )

    if "default_output_dir" in patch:
        raw_out = str(patch["default_output_dir"] or "").strip()
        if not raw_out:
            raise BusinessRuleError("La carpeta de salida predeterminada no puede estar vacia.")

    cfg = load_user_config()
    current = _sanitize_desktop_config(cfg.get("desktop"))
    merged_raw = {**current, **patch}
    merged = _sanitize_desktop_config(merged_raw)

    cfg["desktop"] = merged
    save_user_config(cfg)

    sync_windows_autostart(merged["start_with_windows"], merged["start_minimized"])
    sync_windows_context_menu(merged["context_menu_enabled"])
    return merged


def _dir_size_bytes(path: Path, exclude_names: Optional[set] = None) -> int:
    total = 0
    if not path.is_dir():
        return 0
    excluded = exclude_names or set()
    try:
        with os.scandir(path) as entries:
            for entry in entries:
                if entry.name in excluded:
                    continue
                try:
                    if entry.is_file(follow_symlinks=False):
                        total += entry.stat(follow_symlinks=False).st_size
                    elif entry.is_dir(follow_symlinks=False):
                        total += _dir_size_bytes(Path(entry.path))
                except OSError:
                    continue
    except OSError:
        return 0
    return total


def _disk_probe_path() -> Path:
    temp_dir = Path(settings.TEMP_DIR)
    if temp_dir.exists():
        return temp_dir
    data_dir = get_effective_data_dir()
    if data_dir.exists():
        return data_dir
    return Path(settings.BASE_DIR)


def get_storage_summary() -> Dict[str, Any]:
    """Calcula espacio en disco y uso local por temporales, sesion, modelos IA y recetas."""
    probe = _disk_probe_path()
    try:
        usage = shutil.disk_usage(str(probe))
        total_bytes = int(usage.total)
        used_bytes = int(usage.used)
        free_bytes = int(usage.free)
    except OSError:
        total_bytes = 0
        used_bytes = 0
        free_bytes = 0

    temp_dir = Path(settings.TEMP_DIR)
    temp_bytes = _dir_size_bytes(temp_dir, exclude_names={"session_assets"})
    session_bytes = _dir_size_bytes(Path(settings.SESSION_ASSETS_DIR))
    models_bytes = (
        _dir_size_bytes(Path(settings.USER_MODELS_DIR))
        + _dir_size_bytes(Path(_get_user_tessdata_dir()))
        + _dir_size_bytes(Path(settings.USER_MODULES_DIR))
    )
    recipes_bytes = _dir_size_bytes(Path(settings.USER_RECIPES_DIR))
    updates_bytes = _dir_size_bytes(get_effective_data_dir() / "updates")

    desktop_cfg = get_desktop_config()
    return {
        "free_bytes": free_bytes,
        "used_bytes": used_bytes,
        "total_bytes": total_bytes,
        "temp_bytes": temp_bytes,
        "session_bytes": session_bytes,
        "models_bytes": models_bytes,
        "recipes_bytes": recipes_bytes,
        "updates_bytes": updates_bytes,
        "low_space_warning": bool(total_bytes > 0 and free_bytes < LOW_DISK_THRESHOLD_BYTES),
        "data_dir": str(get_effective_data_dir()),
        "default_output_dir": desktop_cfg["default_output_dir"],
    }


def check_disk_quota(required_bytes: int) -> Dict[str, Any]:
    """Evalua si hay espacio libre suficiente antes de ejecutar un trabajo pesado."""
    safe_req = max(0, int(required_bytes or 0))
    recommended_free_bytes = max(MIN_RECOMMENDED_DISK_BYTES, safe_req * 3)

    probe = _disk_probe_path()
    try:
        usage = shutil.disk_usage(str(probe))
        free_bytes = int(usage.free)
    except OSError:
        free_bytes = recommended_free_bytes

    low_space_warning = free_bytes < recommended_free_bytes
    critical_low = free_bytes < CRITICAL_DISK_THRESHOLD_BYTES
    free_mb = free_bytes / (1024 * 1024)
    rec_mb = recommended_free_bytes / (1024 * 1024)

    message = (
        f"Espacio libre bajo ({free_mb:.0f} MB disponibles; se recomiendan al menos {rec_mb:.0f} MB)."
        if low_space_warning
        else f"Espacio en disco suficiente ({free_mb:.0f} MB libres)."
    )
    return {
        "ok": not low_space_warning,
        "low_space_warning": low_space_warning,
        "critical_low": critical_low,
        "free_bytes": free_bytes,
        "recommended_free_bytes": recommended_free_bytes,
        "message": message,
    }


def purge_temp_storage(include_session: bool = False) -> Dict[str, Any]:
    """Elimina archivos temporales huerfanos y opcionalmente limpia los archivos de sesion."""
    freed_bytes = 0
    temp_dir = Path(settings.TEMP_DIR)

    if temp_dir.is_dir():
        for entry in list(temp_dir.iterdir()):
            if entry.name == "session_assets":
                continue
            try:
                if entry.is_file() or entry.is_symlink():
                    size = entry.stat().st_size
                    entry.unlink()
                    freed_bytes += size
                elif entry.is_dir():
                    size = _dir_size_bytes(entry)
                    shutil.rmtree(entry, ignore_errors=True)
                    freed_bytes += size
            except OSError:
                continue

    if include_session:
        session_dir = Path(settings.SESSION_ASSETS_DIR)
        if session_dir.is_dir():
            for entry in list(session_dir.iterdir()):
                try:
                    if entry.is_file():
                        size = entry.stat().st_size
                        entry.unlink()
                        freed_bytes += size
                    elif entry.is_dir():
                        size = _dir_size_bytes(entry)
                        shutil.rmtree(entry, ignore_errors=True)
                        freed_bytes += size
                except OSError:
                    continue
        job_manager.clear_assets()

    return {
        "purged": True,
        "include_session": bool(include_session),
        "freed_bytes": freed_bytes,
        "storage": get_storage_summary(),
    }


def open_local_folder(target: str) -> Dict[str, Any]:
    """Abre en el explorador nativo la carpeta de datos locales o de salida predeterminada."""
    clean_target = (target or "output").strip().lower()
    if clean_target not in ("data", "output"):
        raise BusinessRuleError("Destino de carpeta invalido. Usa 'data' u 'output'.")

    folder = (
        get_effective_data_dir()
        if clean_target == "data"
        else Path(get_desktop_config()["default_output_dir"]).expanduser()
    )
    folder.mkdir(parents=True, exist_ok=True)
    resolved = str(folder.resolve())

    opened = False
    if not _is_env_truthy("TORNIO_DISABLE_SHELL_OPEN"):
        try:
            if sys.platform == "win32":
                os.startfile(resolved)  # type: ignore[attr-defined]
            elif sys.platform == "darwin":
                subprocess.Popen(["open", resolved])
            else:
                subprocess.Popen(["xdg-open", resolved])
            opened = True
        except Exception as exc:
            logger.warning("No se pudo abrir la carpeta %s: %s", resolved, exc)

    return {"opened": opened, "target": clean_target, "path": resolved}


def sanitize_output_filename(raw_name: str) -> str:
    """Sanea el nombre de salida bloqueando path traversal y caracteres invalidos de Windows."""
    normalized = str(raw_name or "").replace("\\", "/")
    base = normalized.split("/")[-1].strip()
    base = INVALID_FILENAME_CHARS_RE.sub("_", base).strip(". ")
    if not base or base in (".", ".."):
        base = "resultado_tornio"
    return base


def save_output_file(
    filename: str,
    content: bytes,
    target_dir: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Guarda un archivo en carpeta fija evitando sobreescribir con sufijos numericos (1), (2)...
    Si smart_zip_downloads esta desactivado y la salida es un archivo .zip valido,
    desempaqueta de forma segura su contenido dentro de una subcarpeta dedicada.
    """
    cfg = get_desktop_config()
    raw_dir = (target_dir or cfg["default_output_dir"]).strip()
    if not raw_dir:
        raise BusinessRuleError("La carpeta de destino no puede estar vacia.")

    dest_dir = Path(raw_dir).expanduser().resolve()
    dest_dir.mkdir(parents=True, exist_ok=True)

    clean_name = sanitize_output_filename(filename)
    stem = Path(clean_name).stem or "resultado_tornio"
    suffix = Path(clean_name).suffix

    smart_zip = bool(cfg.get("smart_zip_downloads", True))
    if not smart_zip and clean_name.lower().endswith(".zip") and zipfile.is_zipfile(io.BytesIO(content)):
        max_members = 2000
        max_uncompressed = 2 * 1024 * 1024 * 1024
        safe_entries: List[Tuple[Tuple[str, ...], zipfile.ZipInfo]] = []
        cumulative_size = 0
        exceeded_limits = False

        with zipfile.ZipFile(io.BytesIO(content), "r") as zf:
            for info in zf.infolist():
                if info.is_dir():
                    continue
                if stat.S_ISLNK(info.external_attr >> 16):
                    continue
                raw_entry = info.filename.replace("\\", "/").strip()
                if not raw_entry or raw_entry.startswith("/"):
                    continue
                posix_parts = PurePosixPath(raw_entry).parts
                if not posix_parts or ":" in posix_parts[0]:
                    continue
                if any(part in ("", ".", "..") for part in posix_parts):
                    continue

                clean_parts = tuple(sanitize_output_filename(part) for part in posix_parts)
                cumulative_size += max(0, int(info.file_size))
                if len(safe_entries) >= max_members or cumulative_size > max_uncompressed:
                    exceeded_limits = True
                    break
                safe_entries.append((clean_parts, info))

            if safe_entries and not exceeded_limits:
                extract_dir = (dest_dir / stem).resolve()
                extract_counter = 1
                while extract_dir.exists():
                    extract_dir = (dest_dir / f"{stem} ({extract_counter})").resolve()
                    extract_counter += 1
                try:
                    extract_dir.relative_to(dest_dir)
                except ValueError as exc:
                    raise BusinessRuleError("Subcarpeta de extraccion invalida fuera del directorio permitido.") from exc

                extract_dir.mkdir(parents=True, exist_ok=True)
                extracted_names: List[str] = []
                total_written = 0

                for parts, info in safe_entries:
                    member_target = extract_dir.joinpath(*parts).resolve()
                    try:
                        member_target.relative_to(extract_dir)
                    except ValueError:
                        continue
                    member_target.parent.mkdir(parents=True, exist_ok=True)
                    member_bytes = zf.read(info)
                    tmp_member = member_target.with_name(f".{member_target.name}.{time.time_ns()}.tmp")
                    try:
                        tmp_member.write_bytes(member_bytes)
                        tmp_member.replace(member_target)
                    finally:
                        if tmp_member.exists():
                            try:
                                tmp_member.unlink()
                            except OSError:
                                pass
                    extracted_names.append("/".join(parts))
                    total_written += len(member_bytes)

                if extracted_names:
                    return {
                        "saved": True,
                        "saved_path": str(extract_dir),
                        "directory": str(extract_dir),
                        "filename": extract_dir.name,
                        "size_bytes": total_written,
                        "extracted_files": extracted_names,
                        "extracted_count": len(extracted_names),
                    }

    candidate = (dest_dir / clean_name).resolve()
    try:
        candidate.relative_to(dest_dir)
    except ValueError as exc:
        raise BusinessRuleError("Nombre de archivo invalido fuera del directorio permitido.") from exc

    counter = 1
    while candidate.exists():
        numbered = f"{stem} ({counter}){suffix}"
        candidate = (dest_dir / numbered).resolve()
        candidate.relative_to(dest_dir)
        counter += 1

    tmp_path = candidate.with_name(f".{candidate.name}.{time.time_ns()}.tmp")
    try:
        tmp_path.write_bytes(content)
        tmp_path.replace(candidate)
    finally:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass

    return {
        "saved": True,
        "saved_path": str(candidate),
        "directory": str(dest_dir),
        "filename": candidate.name,
        "size_bytes": len(content),
    }


def validate_update_url(raw_url: str) -> str:
    """Valida que la URL de actualizacion sea HTTPS y pertenezca estrictamente al allowlist de GitHub."""
    url = (raw_url or "").strip()
    if not url:
        raise BusinessRuleError("La URL de actualizacion no puede estar vacia.")

    parsed = urlparse(url)
    if parsed.scheme.lower() != "https":
        raise BusinessRuleError("Las actualizaciones automaticas requieren exclusivamente HTTPS.")

    hostname = (parsed.hostname or "").strip().lower()
    if hostname not in ALLOWED_UPDATE_HOSTS:
        raise BusinessRuleError(
            f"Origen no autorizado para auto-actualizacion ('{hostname}'). "
            "Solo se permiten servidores oficiales de GitHub Releases."
        )
    return url


def parse_sha256sums(manifest_text: str, asset_name: str) -> Optional[str]:
    """Extrae el hash SHA-256 esperado para asset_name desde SHA256SUMS.txt o notas Markdown."""
    if not manifest_text or not asset_name:
        return None
    target_lower = Path(asset_name).name.lower()

    for line in manifest_text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue

        # Formato estandar sha256sum: "<64-hex>  <filename>" o "<64-hex> *<filename>"
        std_match = re.match(r"^([a-fA-F0-9]{64})\s+[*]?(.+?)\s*$", stripped)
        if std_match:
            digest = std_match.group(1).lower()
            entry_name = Path(std_match.group(2).strip()).name.lower()
            if entry_name == target_lower:
                return digest

        # Fallback: linea en tabla/nota Markdown que menciona el archivo y un digest SHA-256
        if target_lower in stripped.lower():
            hex_hit = SHA256_HEX_RE.search(stripped)
            if hex_hit:
                return hex_hit.group(1).lower()

    return None


def verify_file_sha256(file_path: Path, expected_sha256: str) -> Tuple[bool, str]:
    """Verifica el SHA-256 de un archivo en bloques de 1 MiB usando comparacion constante."""
    expected = (expected_sha256 or "").strip().lower()
    if not SHA256_HEX_RE.fullmatch(expected):
        return False, ""

    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while True:
            chunk = f.read(1024 * 1024)
            if not chunk:
                break
            hasher.update(chunk)
    actual = hasher.hexdigest().lower()
    return hmac.compare_digest(actual, expected), actual


class SelfUpdaterManager:
    """Gestor thread-safe para descargar, verificar SHA-256 y aplicar actualizaciones de Tornio."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._cancel_event = threading.Event()
        self._state: Dict[str, Any] = self._blank_state()
        self._shutdown_hook: Optional[Callable[[], None]] = None

    @staticmethod
    def _blank_state() -> Dict[str, Any]:
        return {
            "status": "idle",
            "target_version": None,
            "asset_name": None,
            "downloaded_bytes": 0,
            "total_bytes": 0,
            "percent": 0,
            "sha256_expected": None,
            "sha256_actual": None,
            "verified": False,
            "file_path": None,
            "install_kind": None,
            "error": None,
        }

    def set_shutdown_hook(self, hook: Optional[Callable[[], None]]) -> None:
        with self._lock:
            self._shutdown_hook = hook

    def reset_for_tests(self) -> None:
        with self._lock:
            self._cancel_event.clear()
            self._state = self._blank_state()

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            return dict(self._state)

    def _updates_dir(self) -> Path:
        up_dir = get_effective_data_dir() / "updates"
        up_dir.mkdir(parents=True, exist_ok=True)
        return up_dir

    @staticmethod
    def _detect_install_kind(asset_name: str) -> str:
        lower = asset_name.lower()
        if "setup" in lower:
            return "installer"
        return "portable"

    def _fetch_checksum_text(self, client: httpx.Client, checksums_url: str) -> str:
        current = validate_update_url(checksums_url)
        for hop in range(6):
            resp = client.get(
                current,
                headers={"User-Agent": f"Tornio/{settings.VERSION}"},
                follow_redirects=False,
            )
            if resp.status_code in REDIRECT_STATUS_CODES:
                loc = resp.headers.get("location") or resp.headers.get("Location")
                if not loc or hop >= 5:
                    raise BusinessRuleError("Demasiadas redirecciones al obtener SHA256SUMS.txt.")
                current = validate_update_url(urljoin(current, str(loc).strip()))
                continue
            resp.raise_for_status()
            return resp.text
        raise BusinessRuleError("No se pudo descargar el manifiesto SHA256SUMS.txt.")

    def _stream_validated_download(
        self,
        client: httpx.Client,
        download_url: str,
        tmp_path: Path,
    ) -> int:
        current = validate_update_url(download_url)
        for hop in range(6):
            with client.stream(
                "GET",
                current,
                headers={"User-Agent": f"Tornio/{settings.VERSION}"},
                follow_redirects=False,
            ) as resp:
                if resp.status_code in REDIRECT_STATUS_CODES:
                    loc = resp.headers.get("location") or resp.headers.get("Location")
                    if not loc or hop >= 5:
                        raise BusinessRuleError("Demasiadas redirecciones al descargar actualizacion.")
                    current = validate_update_url(urljoin(current, str(loc).strip()))
                    continue

                resp.raise_for_status()
                total_header = resp.headers.get("content-length")
                total_bytes = int(total_header) if total_header and total_header.isdigit() else 0
                downloaded = 0
                with self._lock:
                    self._state["total_bytes"] = total_bytes

                with open(tmp_path, "wb") as out_f:
                    for chunk in resp.iter_bytes(chunk_size=1024 * 64):
                        if self._cancel_event.is_set():
                            return -1
                        if chunk:
                            out_f.write(chunk)
                            downloaded += len(chunk)
                            pct = (
                                min(99, int((downloaded * 100) / total_bytes))
                                if total_bytes > 0
                                else 0
                            )
                            with self._lock:
                                self._state["downloaded_bytes"] = downloaded
                                self._state["percent"] = pct
                return downloaded

        raise BusinessRuleError("No se pudo completar la descarga de actualizacion.")

    def verify_downloaded_artifact(
        self,
        target_path: Path,
        asset_name: str,
        expected_sha256: Optional[str] = None,
        checksums_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Verifica estrictamente el archivo contra expected_sha256 o SHA256SUMS; borra si falla."""
        expected = (expected_sha256 or "").strip().lower() or None
        if not expected and checksums_text:
            expected = parse_sha256sums(checksums_text, asset_name)

        if not expected or not SHA256_HEX_RE.fullmatch(expected):
            if target_path.exists():
                target_path.unlink(missing_ok=True)
            with self._lock:
                self._state.update(
                    {
                        "status": "error",
                        "sha256_expected": expected,
                        "sha256_actual": None,
                        "verified": False,
                        "file_path": None,
                        "error": (
                            f"No se encontro una firma SHA-256 valida en SHA256SUMS.txt para '{asset_name}'. "
                            "Por seguridad, el binario fue rechazado y eliminado."
                        ),
                    }
                )
                return dict(self._state)

        ok, actual = verify_file_sha256(target_path, expected)
        if not ok:
            if target_path.exists():
                target_path.unlink(missing_ok=True)
            with self._lock:
                self._state.update(
                    {
                        "status": "error",
                        "sha256_expected": expected,
                        "sha256_actual": actual,
                        "verified": False,
                        "file_path": None,
                        "error": (
                            "Fallo la verificacion criptografica SHA-256: el archivo descargado no coincide "
                            "con la firma oficial de la Release y fue eliminado."
                        ),
                    }
                )
                return dict(self._state)

        with self._lock:
            self._state.update(
                {
                    "status": "ready_to_install",
                    "percent": 100,
                    "sha256_expected": expected,
                    "sha256_actual": actual,
                    "verified": True,
                    "file_path": str(target_path),
                    "error": None,
                }
            )
            return dict(self._state)

    def _download_worker(
        self,
        validated_url: str,
        target_version: str,
        asset_name: str,
        validated_checksums_url: Optional[str],
        expected_sha256: Optional[str],
    ) -> None:
        updates_dir = self._updates_dir()
        target_path = updates_dir / asset_name
        tmp_path = target_path.with_name(f"{asset_name}.part")
        try:
            with httpx.Client(timeout=120.0, follow_redirects=False) as client:
                downloaded = self._stream_validated_download(client, validated_url, tmp_path)
                if downloaded < 0 or self._cancel_event.is_set():
                    tmp_path.unlink(missing_ok=True)
                    with self._lock:
                        self._state.update({"status": "cancelled", "file_path": None, "error": None})
                    return

                if downloaded <= 0 or not tmp_path.is_file():
                    raise BusinessRuleError("El paquete de actualizacion descargado esta vacio.")

                tmp_path.replace(target_path)
                with self._lock:
                    self._state["status"] = "verifying"

                manifest_text: Optional[str] = None
                if not expected_sha256 and validated_checksums_url:
                    manifest_text = self._fetch_checksum_text(client, validated_checksums_url)

            self.verify_downloaded_artifact(
                target_path=target_path,
                asset_name=asset_name,
                expected_sha256=expected_sha256,
                checksums_text=manifest_text,
            )
        except Exception as exc:
            tmp_path.unlink(missing_ok=True)
            target_path.unlink(missing_ok=True)
            with self._lock:
                self._state.update(
                    {
                        "status": "error",
                        "verified": False,
                        "file_path": None,
                        "error": f"Error al descargar o verificar la actualizacion: {str(exc)}",
                    }
                )

    def start_download(
        self,
        download_url: str,
        target_version: str,
        asset_name: Optional[str] = None,
        checksums_url: Optional[str] = None,
        expected_sha256: Optional[str] = None,
    ) -> Dict[str, Any]:
        validated_url = validate_update_url(download_url)
        validated_checksums_url = validate_update_url(checksums_url) if checksums_url else None
        if not validated_checksums_url and not expected_sha256:
            raise BusinessRuleError(
                "Se requiere checksums_url (SHA256SUMS.txt) o expected_sha256 para verificar la descarga."
            )

        derived_name = sanitize_output_filename(
            asset_name or Path(urlparse(validated_url).path).name or f"Tornio_Setup_v{target_version}.exe"
        )
        if not derived_name.lower().endswith(".exe"):
            raise BusinessRuleError("El paquete de actualizacion debe ser un ejecutable .exe valido.")

        clean_ver = str(target_version or "").strip().lstrip("vV")
        if not clean_ver:
            raise BusinessRuleError("Se requiere la version destino para descargar la actualizacion.")

        with self._lock:
            if self._state["status"] in ("downloading", "verifying"):
                return dict(self._state)

            self._cancel_event.clear()
            self._state = {
                "status": "downloading",
                "target_version": clean_ver,
                "asset_name": derived_name,
                "downloaded_bytes": 0,
                "total_bytes": 0,
                "percent": 0,
                "sha256_expected": expected_sha256.lower() if expected_sha256 else None,
                "sha256_actual": None,
                "verified": False,
                "file_path": None,
                "install_kind": self._detect_install_kind(derived_name),
                "error": None,
            }

        thread = threading.Thread(
            target=self._download_worker,
            args=(
                validated_url,
                clean_ver,
                derived_name,
                validated_checksums_url,
                expected_sha256,
            ),
            daemon=True,
        )
        thread.start()
        return self.get_status()

    def cancel_download(self) -> Dict[str, Any]:
        with self._lock:
            self._cancel_event.set()
            asset_name = self._state.get("asset_name")
            if asset_name:
                up_dir = self._updates_dir()
                (up_dir / f"{asset_name}.part").unlink(missing_ok=True)
            self._state.update(
                {
                    "status": "cancelled",
                    "verified": False,
                    "file_path": None,
                    "error": None,
                }
            )
            return dict(self._state)

    def apply_update(self) -> Dict[str, Any]:
        with self._lock:
            if self._state.get("status") != "ready_to_install" or not self._state.get("verified"):
                raise BusinessRuleError(
                    "No hay ninguna actualizacion verificada lista para instalar."
                )
            file_path_str = self._state.get("file_path")
            expected = self._state.get("sha256_expected") or ""
            install_kind = self._state.get("install_kind") or "installer"
            target_version = self._state.get("target_version")

        if not file_path_str or not os.path.isfile(file_path_str):
            raise BusinessRuleError("El paquete de actualizacion verificado ya no existe en disco.")

        artifact = Path(file_path_str)
        ok, _ = verify_file_sha256(artifact, expected)
        if not ok:
            artifact.unlink(missing_ok=True)
            with self._lock:
                self._state.update({"status": "error", "verified": False, "file_path": None})
            raise BusinessRuleError(
                "El paquete fallo la re-verificacion SHA-256 antes de ejecutarse y fue eliminado."
            )

        with self._lock:
            self._state["status"] = "installing"
            shutdown_hook = self._shutdown_hook

        if _is_env_truthy("TORNIO_UPDATER_DRY_RUN"):
            return {
                "applied": True,
                "dry_run": True,
                "install_kind": install_kind,
                "target_version": target_version,
                "file_path": str(artifact),
                "verified": True,
            }

        if sys.platform == "win32":
            if install_kind == "installer" or not getattr(sys, "frozen", False):
                subprocess.Popen(
                    [str(artifact), "/SILENT", "/CLOSEAPPLICATIONS", "/RESTARTAPPLICATIONS"],
                    creationflags=CREATE_NO_WINDOW,
                )
            else:
                current_exe = Path(sys.executable).resolve()
                swap_cmd = self._updates_dir() / "apply_portable_update.cmd"
                pid = os.getpid()
                script_lines = [
                    "@echo off",
                    ":waitloop",
                    f'tasklist /FI "PID eq {pid}" 2>NUL | find /I "{pid}" >NUL',
                    "if %errorlevel%==0 (",
                    "  timeout /t 1 /nobreak >NUL",
                    "  goto waitloop",
                    ")",
                    f'move /y "{artifact}" "{current_exe}" >NUL',
                    f'start "" "{current_exe}"',
                    'del "%~f0"',
                ]
                swap_cmd.write_text("\r\n".join(script_lines), encoding="utf-8")
                subprocess.Popen(["cmd.exe", "/c", str(swap_cmd)], creationflags=CREATE_NO_WINDOW)

        if shutdown_hook is not None:
            threading.Timer(0.6, shutdown_hook).start()

        return {
            "applied": True,
            "dry_run": False,
            "install_kind": install_kind,
            "target_version": target_version,
            "file_path": str(artifact),
            "verified": True,
        }


class ActiveProcessRegistry:
    """Registro de subprocesos sincronos vinculados a X-Request-Id para cancelacion instantanea."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._procs: Dict[str, set[subprocess.Popen]] = {}
        self._cancelled: Dict[str, float] = {}

    def _prune_cancelled_locked(self) -> None:
        if len(self._cancelled) < 256:
            return
        cutoff = time.monotonic() - 600.0
        stale = [rid for rid, ts in self._cancelled.items() if ts < cutoff]
        for rid in stale:
            self._cancelled.pop(rid, None)

    @staticmethod
    def _kill_proc_tree(proc: subprocess.Popen) -> None:
        try:
            if proc.poll() is not None:
                return
            proc.terminate()
            try:
                proc.wait(timeout=0.4)
                return
            except subprocess.TimeoutExpired:
                pass
            if sys.platform == "win32":
                try:
                    subprocess.run(
                        ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                        capture_output=True,
                        timeout=3,
                        creationflags=CREATE_NO_WINDOW,
                    )
                except Exception:
                    pass
            if proc.poll() is None:
                proc.kill()
        except Exception as exc:
            logger.warning("Error al finalizar subproceso cancelado: %s", exc)

    def is_cancelled(self, request_id: Optional[str]) -> bool:
        if not request_id:
            return False
        with self._lock:
            return request_id in self._cancelled

    def register(self, request_id: Optional[str], proc: subprocess.Popen) -> bool:
        if not request_id:
            return True
        should_kill = False
        with self._lock:
            self._prune_cancelled_locked()
            if request_id in self._cancelled:
                should_kill = True
            else:
                self._procs.setdefault(request_id, set()).add(proc)
        if should_kill:
            self._kill_proc_tree(proc)
            return False
        return True

    def unregister(self, request_id: Optional[str], proc: subprocess.Popen) -> None:
        if not request_id:
            return
        with self._lock:
            bucket = self._procs.get(request_id)
            if bucket is not None:
                bucket.discard(proc)
                if not bucket:
                    self._procs.pop(request_id, None)

    def cancel(self, request_id: str) -> Dict[str, Any]:
        clean_id = (request_id or "").strip()
        if not clean_id:
            raise BusinessRuleError("request_id no puede estar vacio.")
        with self._lock:
            self._prune_cancelled_locked()
            self._cancelled[clean_id] = time.monotonic()
            procs = list(self._procs.pop(clean_id, set()))

        for proc in procs:
            self._kill_proc_tree(proc)

        return {
            "cancelled": True,
            "request_id": clean_id,
            "terminated_count": len(procs),
        }


self_updater = SelfUpdaterManager()
active_process_registry = ActiveProcessRegistry()


def run_cancellable_cmd(
    cmd: List[str],
    timeout: int = 300,
    request_id: Optional[str] = None,
) -> subprocess.CompletedProcess:
    """Ejecuta un comando como subproceso cancelable en milisegundos via ActiveProcessRegistry."""
    rid = request_id or current_request_id.get()
    if rid and active_process_registry.is_cancelled(rid):
        raise HTTPException(status_code=499, detail="Operación cancelada por el usuario.")

    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        creationflags=CREATE_NO_WINDOW,
    )
    accepted = active_process_registry.register(rid, proc)
    if not accepted:
        raise HTTPException(status_code=499, detail="Operación cancelada por el usuario.")

    try:
        stdout, stderr = proc.communicate(timeout=timeout)
    except subprocess.TimeoutExpired as exc:
        active_process_registry._kill_proc_tree(proc)
        raise exc
    finally:
        active_process_registry.unregister(rid, proc)

    if rid and active_process_registry.is_cancelled(rid):
        raise HTTPException(status_code=499, detail="Operación cancelada por el usuario.")

    return subprocess.CompletedProcess(
        args=cmd,
        returncode=proc.returncode,
        stdout=stdout or "",
        stderr=stderr or "",
    )
