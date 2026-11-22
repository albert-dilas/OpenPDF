"""Tests para configuracion desktop, Disk Space Guard, guardado fijo, Auto-Updater SHA-256 y cancelacion real."""
from __future__ import annotations

import hashlib
import shutil
import sys
import threading
import time
from collections import namedtuple

from fastapi.testclient import TestClient

from app.core.exceptions import BusinessRuleError
from app.main import app
from app.services import desktop_service
from app.services.desktop_service import (
    SelfUpdaterManager,
    active_process_registry,
    parse_sha256sums,
    run_cancellable_cmd,
    validate_update_url,
)

client = TestClient(app)


def test_desktop_config_defaults_and_persistence(tmp_path, monkeypatch):
    cfg_file = tmp_path / "config.json"
    monkeypatch.setenv("TORNIO_CONFIG_PATH", str(cfg_file))
    monkeypatch.setenv("TORNIO_DISABLE_REGISTRY_SYNC", "1")

    res = client.get("/api/v1/system/desktop-config")
    assert res.status_code == 200
    data = res.json()
    assert data["keep_in_background"] is False
    assert data["start_with_windows"] is False
    assert data["start_minimized"] is True
    assert data["context_menu_enabled"] is False
    assert data["update_mode"] == "notify"
    assert data["save_mode"] == "ask"
    assert data["clean_temp_on_exit"] is True
    assert data["smart_zip_downloads"] is True

    # Actualizar y comprobar persistencia
    fixed_out = str(tmp_path / "SalidasTornio")
    res_put = client.put(
        "/api/v1/system/desktop-config",
        json={
            "keep_in_background": True,
            "start_with_windows": True,
            "context_menu_enabled": True,
            "update_mode": "auto",
            "save_mode": "fixed_folder",
            "default_output_dir": fixed_out,
            "clean_temp_on_exit": False,
            "smart_zip_downloads": False,
        },
    )
    assert res_put.status_code == 200
    updated = res_put.json()
    assert updated["keep_in_background"] is True
    assert updated["update_mode"] == "auto"
    assert updated["save_mode"] == "fixed_folder"
    assert updated["default_output_dir"] == fixed_out
    assert updated["smart_zip_downloads"] is False

    res_again = client.get("/api/v1/system/desktop-config")
    assert res_again.status_code == 200
    assert res_again.json()["update_mode"] == "auto"

    # Validacion de valores invalidos (422)
    res_bad = client.put(
        "/api/v1/system/desktop-config",
        json={"update_mode": "always_unverified"},
    )
    assert res_bad.status_code == 422

    res_bad_save = client.put(
        "/api/v1/system/desktop-config",
        json={"save_mode": "cloud_bucket"},
    )
    assert res_bad_save.status_code == 422


def test_storage_summary_disk_quota_and_purge(tmp_path, monkeypatch):
    monkeypatch.setenv("TORNIO_CONFIG_PATH", str(tmp_path / "config.json"))
    monkeypatch.setenv("TORNIO_DISABLE_REGISTRY_SYNC", "1")
    monkeypatch.setenv("TORNIO_DISABLE_SHELL_OPEN", "1")

    temp_dir = tmp_path / "temp_files"
    session_dir = temp_dir / "session_assets"
    temp_dir.mkdir(parents=True)
    session_dir.mkdir(parents=True)
    (temp_dir / "orphan.pdf").write_bytes(b"X" * 4096)
    (session_dir / "kept_asset.pdf").write_bytes(b"Y" * 2048)

    monkeypatch.setattr(desktop_service.settings, "TEMP_DIR", str(temp_dir))
    monkeypatch.setattr(desktop_service.settings, "SESSION_ASSETS_DIR", session_dir)

    res_storage = client.get("/api/v1/system/storage")
    assert res_storage.status_code == 200
    summary = res_storage.json()
    assert summary["temp_bytes"] == 4096
    assert summary["session_bytes"] == 2048
    assert summary["free_bytes"] > 0

    DiskUsage = namedtuple("DiskUsage", ["total", "used", "free"])

    # Simular espacio suficiente
    monkeypatch.setattr(
        shutil,
        "disk_usage",
        lambda _p: DiskUsage(total=100 * 1024**3, used=50 * 1024**3, free=50 * 1024**3),
    )
    res_ok = client.post("/api/v1/system/storage/check-quota", json={"required_bytes": 10 * 1024**2})
    assert res_ok.status_code == 200
    assert res_ok.json()["low_space_warning"] is False
    assert res_ok.json()["ok"] is True

    # Simular espacio bajo (120 MB libres)
    monkeypatch.setattr(
        shutil,
        "disk_usage",
        lambda _p: DiskUsage(total=100 * 1024**3, used=99 * 1024**3, free=120 * 1024**2),
    )
    res_low = client.post("/api/v1/system/storage/check-quota", json={"required_bytes": 200 * 1024**2})
    assert res_low.status_code == 200
    low_payload = res_low.json()
    assert low_payload["low_space_warning"] is True
    assert low_payload["ok"] is False

    # Purgar temporales sin borrar session_assets
    res_purge = client.post("/api/v1/system/storage/purge-temp", json={"include_session": False})
    assert res_purge.status_code == 200
    purge_data = res_purge.json()
    assert purge_data["purged"] is True
    assert purge_data["freed_bytes"] >= 4096
    assert not (temp_dir / "orphan.pdf").exists()
    assert (session_dir / "kept_asset.pdf").is_file()

    res_folder = client.post("/api/v1/system/storage/open-folder", json={"target": "data"})
    assert res_folder.status_code == 200
    assert res_folder.json()["target"] == "data"


def test_save_output_fixed_folder_collision_and_traversal_guard(tmp_path, monkeypatch):
    cfg_file = tmp_path / "config.json"
    out_dir = tmp_path / "fixed_outputs"
    monkeypatch.setenv("TORNIO_CONFIG_PATH", str(cfg_file))
    monkeypatch.setenv("TORNIO_DISABLE_REGISTRY_SYNC", "1")

    client.put(
        "/api/v1/system/desktop-config",
        json={"save_mode": "fixed_folder", "default_output_dir": str(out_dir)},
    )

    # Primer guardado
    r1 = client.post(
        "/api/v1/system/storage/save-output",
        files=[("file", ("report.pdf", b"%PDF-1.4\nfirst", "application/pdf"))],
        data={"filename": "report.pdf"},
    )
    assert r1.status_code == 200
    assert r1.json()["filename"] == "report.pdf"
    assert (out_dir / "report.pdf").read_bytes() == b"%PDF-1.4\nfirst"

    # Colision debe autogenerar sufijo (1)
    r2 = client.post(
        "/api/v1/system/storage/save-output",
        files=[("file", ("report.pdf", b"%PDF-1.4\nsecond", "application/pdf"))],
        data={"filename": "report.pdf"},
    )
    assert r2.status_code == 200
    assert r2.json()["filename"] == "report (1).pdf"
    assert (out_dir / "report (1).pdf").read_bytes() == b"%PDF-1.4\nsecond"

    # Path traversal debe sanitizarse dentro de fixed_outputs
    r3 = client.post(
        "/api/v1/system/storage/save-output",
        files=[("file", ("evil.pdf", b"safe-payload", "application/pdf"))],
        data={"filename": "../../etc/evil.pdf"},
    )
    assert r3.status_code == 200
    saved_path = r3.json()["saved_path"]
    assert str(out_dir.resolve()) in saved_path
    assert (out_dir / "evil.pdf").is_file()
    assert not (tmp_path / "evil.pdf").exists()


def test_self_updater_allowlist_and_sha256_verification(tmp_path, monkeypatch):
    monkeypatch.setenv("TORNIO_CONFIG_PATH", str(tmp_path / "config.json"))
    monkeypatch.setenv("TORNIO_UPDATER_DRY_RUN", "1")

    updater = SelfUpdaterManager()

    # Rechazo estricto de hosts fuera del allowlist y esquemas inseguros
    for bad_url in (
        "http://github.com/albert-dilas/OpenPDF/releases/download/v3.1.0/Tornio_Setup_v3.1.0.exe",
        "https://evil-mirror.example.com/Tornio_Setup_v3.1.0.exe",
        "https://127.0.0.1/Tornio_Setup_v3.1.0.exe",
    ):
        try:
            validate_update_url(bad_url)
            raise AssertionError(f"Debio rechazar URL no autorizada: {bad_url}")
        except BusinessRuleError:
            pass

    good_url = validate_update_url(
        "https://github.com/albert-dilas/OpenPDF/releases/download/v3.1.0/Tornio_Setup_v3.1.0.exe"
    )
    assert good_url.startswith("https://github.com/")

    # Preparar artefacto y SHA256SUMS valido
    payload = b"MZ_VERIFIED_TORNIO_INSTALLER_PAYLOAD"
    expected_digest = hashlib.sha256(payload).hexdigest()
    updates_dir = tmp_path / "updates"
    updates_dir.mkdir(parents=True)
    artifact = updates_dir / "Tornio_Setup_v3.1.0.exe"
    artifact.write_bytes(payload)

    sums_text = f"{expected_digest}  Tornio_Setup_v3.1.0.exe\n"
    assert parse_sha256sums(sums_text, "Tornio_Setup_v3.1.0.exe") == expected_digest

    # Verificacion exitosa
    with updater._lock:
        updater._state.update({"target_version": "3.1.0", "asset_name": "Tornio_Setup_v3.1.0.exe", "install_kind": "installer"})
    verified_state = updater.verify_downloaded_artifact(
        target_path=artifact,
        asset_name="Tornio_Setup_v3.1.0.exe",
        checksums_text=sums_text,
    )
    assert verified_state["status"] == "ready_to_install"
    assert verified_state["verified"] is True
    assert verified_state["sha256_actual"] == expected_digest

    # Aplicar en modo dry-run
    applied = updater.apply_update()
    assert applied["applied"] is True
    assert applied["dry_run"] is True
    assert applied["verified"] is True

    # Tampered artifact debe rechazarse y borrarse inmediatamente
    tampered_file = updates_dir / "Tornio_Tampered.exe"
    tampered_file.write_bytes(b"MZ_CORRUPT_OR_TAMPERED")
    bad_state = updater.verify_downloaded_artifact(
        target_path=tampered_file,
        asset_name="Tornio_Setup_v3.1.0.exe",
        expected_sha256=expected_digest,
    )
    assert bad_state["status"] == "error"
    assert bad_state["verified"] is False
    assert not tampered_file.exists()


def test_cancel_active_request_terminates_subprocess_quickly():
    req_id = "test-cancel-req-001"
    result_holder = {}

    def worker():
        try:
            run_cancellable_cmd(
                [sys.executable, "-c", "import time; time.sleep(20)"],
                timeout=30,
                request_id=req_id,
            )
        except Exception as exc:
            result_holder["exc"] = exc

    t = threading.Thread(target=worker, daemon=True)
    t.start()

    # Esperar brevemente hasta que el subproceso quede registrado
    deadline = time.monotonic() + 3.0
    while time.monotonic() < deadline:
        with active_process_registry._lock:
            if req_id in active_process_registry._procs and active_process_registry._procs[req_id]:
                break
        time.sleep(0.05)

    started_cancel = time.monotonic()
    res = client.post(f"/api/v1/system/cancel-request/{req_id}")
    t.join(timeout=3.0)
    elapsed = time.monotonic() - started_cancel

    assert res.status_code == 200
    payload = res.json()
    assert payload["cancelled"] is True
    assert payload["terminated_count"] >= 1
    assert elapsed < 2.0
    assert not t.is_alive()
