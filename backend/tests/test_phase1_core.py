"""Pruebas de integracion y unidad para Tornio v3.0.0 Fase 1 Core."""
import io
import json
import subprocess
import sys
import time
import zipfile
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient
from PIL import Image

import app.main as main_module
import app.utils.network as network_utils
from app.core.config import migrate_legacy_openpdf_data, settings
from app.core.exceptions import BusinessRuleError
from app.core.jobs import job_manager
from app.main import app, select_port
from app.utils.binaries import clear_binaries_cache, find_ffmpeg, find_ffprobe

client = TestClient(app)


@pytest.fixture(autouse=True)
def _cleanup_jobs_and_assets():
    yield
    job_manager.clear_all()


def test_branding_config_and_legacy_migration(tmp_path, monkeypatch):
    assert settings.PROJECT_NAME == "Tornio"
    assert settings.VERSION == "3.0.0"
    assert settings.USER_MODELS_DIR == settings.USER_DATA_DIR / "models"
    assert settings.USER_BIN_DIR == settings.USER_DATA_DIR / "bin"
    assert settings.USER_RECIPES_DIR == settings.USER_DATA_DIR / "recipes"
    assert settings.USER_MODULES_DIR == settings.USER_DATA_DIR / "modules"
    assert settings.SESSION_ASSETS_DIR == Path(settings.TEMP_DIR) / "session_assets"

    legacy_dir = tmp_path / "OpenPDF"
    (legacy_dir / "tessdata").mkdir(parents=True)
    (legacy_dir / "config.json").write_text('{"custom_paths": {"ocr": "C:/tess/tesseract.exe"}}', encoding="utf-8")
    (legacy_dir / "tessdata" / "spa.traineddata").write_bytes(b"LEGACY_SPA")

    tornio_dir = tmp_path / "Tornio"
    migrated = migrate_legacy_openpdf_data(target_dir=tornio_dir, legacy_dir=legacy_dir)
    assert migrated is True
    assert (tornio_dir / "config.json").is_file()
    assert (tornio_dir / "tessdata" / "spa.traineddata").read_bytes() == b"LEGACY_SPA"

    # No debe sobrescribir archivos existentes en Tornio
    (tornio_dir / "config.json").write_text('{"custom_paths": {"ocr": "C:/custom/new.exe"}}', encoding="utf-8")
    migrated_again = migrate_legacy_openpdf_data(target_dir=tornio_dir, legacy_dir=legacy_dir)
    assert migrated_again is False
    assert "C:/custom/new.exe" in (tornio_dir / "config.json").read_text(encoding="utf-8")

    # Verificar alias TORNIO_PORT y fallback OPENPDF_PORT
    monkeypatch.setattr(main_module, "is_port_free", lambda host, port: port in (8007, 8008))
    monkeypatch.setenv("TORNIO_PORT", "8007")
    monkeypatch.setenv("OPENPDF_PORT", "8008")
    assert select_port("127.0.0.1") == 8007


def test_cors_and_exposed_headers():
    res = client.options(
        "/api/v1/system/status",
        headers={
            "Origin": "http://127.0.0.1:3000",
            "Access-Control-Request-Method": "DELETE",
        },
    )
    assert res.status_code == 200
    allow_methods = res.headers.get("access-control-allow-methods", "")
    for method in ("GET", "POST", "PUT", "PATCH", "DELETE"):
        assert method in allow_methods


@pytest.mark.parametrize(
    "redirect_target",
    [
        "http://127.0.0.1/secret",
        "http://localhost:8000/admin",
        "http://169.254.169.254/latest/meta-data/",
    ],
)
def test_ssrf_hop_by_hop_blocks_malicious_redirect(monkeypatch, redirect_target):
    def fake_validate(raw_url: str) -> str:
        if "127.0.0.1" in raw_url or "localhost" in raw_url or "169.254.169.254" in raw_url:
            raise BusinessRuleError("Bloqueado por SSRF")
        return raw_url

    monkeypatch.setattr(network_utils, "validate_public_http_url", fake_validate)
    import app.services.url_to_pdf as url_pdf_mod

    monkeypatch.setattr(url_pdf_mod, "validate_public_http_url", fake_validate)

    calls = {"urls": []}

    class MockRedirectResponse:
        def __init__(self, status_code: int, headers: dict, url: str):
            self.status_code = status_code
            self.headers = headers
            self.url = httpx.URL(url)
            self.content = b""
            self.encoding = "utf-8"

    async def mock_get(self, url, **kwargs):
        calls["urls"].append(str(url))
        return MockRedirectResponse(
            status_code=302,
            headers={"Location": redirect_target},
            url=str(url),
        )

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    res = client.post(
        "/api/v1/url-to-pdf/",
        data={"url": "https://example.org/start", "mode": "reader", "page_size": "a4"},
    )
    assert res.status_code == 400
    assert "ssrf" in res.json()["detail"].lower()
    # Nunca debe haber ejecutado el segundo hop hacia la IP interna
    assert calls["urls"] == ["https://example.org/start"]


def test_ssrf_safe_relative_redirect_succeeds(monkeypatch):
    monkeypatch.setattr(network_utils, "validate_public_http_url", lambda u: u)
    import app.services.url_to_pdf as url_pdf_mod

    monkeypatch.setattr(url_pdf_mod, "validate_public_http_url", lambda u: u)

    calls = []

    class MockResponse:
        def __init__(self, status_code: int, headers: dict, url: str, content: bytes = b""):
            self.status_code = status_code
            self.headers = headers
            self.url = httpx.URL(url)
            self.content = content
            self.encoding = "utf-8"

    async def mock_get(self, url, **kwargs):
        calls.append(str(url))
        if str(url) == "https://example.org/old":
            return MockResponse(302, {"Location": "/new-article"}, str(url))
        return MockResponse(
            200,
            {"content-type": "text/html; charset=utf-8"},
            str(url),
            b"<html><head><title>Tornio Redirect OK</title></head><body><p>Contenido valido tras redireccion segura.</p></body></html>",
        )

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    res = client.post(
        "/api/v1/url-to-pdf/",
        data={"url": "https://example.org/old", "mode": "reader", "page_size": "a4"},
    )
    assert res.status_code == 200
    assert res.content[:4] == b"%PDF"
    assert calls == ["https://example.org/old", "https://example.org/new-article"]


def test_six_engine_modules_status_and_config(tmp_path, monkeypatch):
    cfg_file = tmp_path / "config.json"
    monkeypatch.setenv("TORNIO_CONFIG_PATH", str(cfg_file))
    clear_binaries_cache()

    res = client.get("/api/v1/system/status")
    assert res.status_code == 200
    payload = res.json()
    assert payload["version"] == "3.0.0"
    assert payload["project_name"] == "Tornio"

    for mod_id in ("ocr", "word_to_pdf", "ffmpeg", "yt_dlp", "rembg_onnx", "whisper_cpu"):
        assert mod_id in payload["capabilities"]
        assert mod_id in payload["modules"]

    sys_info = payload["system"]
    assert isinstance(sys_info["cpu_count"], int) and sys_info["cpu_count"] >= 1
    assert isinstance(sys_info["cpu_percent"], (int, float))
    assert isinstance(sys_info["memory_used_percent"], (int, float))
    assert isinstance(sys_info["temp_files_count"], int)

    # Configurar modelo rembg_onnx y binario yt_dlp personalizados
    fake_model = tmp_path / "u2netp.onnx"
    fake_model.write_bytes(b"ONNX_TEST_WEIGHTS")
    res_rembg = client.post(
        "/api/v1/system/configure-module",
        json={"module": "rembg_onnx", "path": str(fake_model)},
    )
    assert res_rembg.status_code == 200
    assert res_rembg.json()["modules"]["rembg_onnx"]["source"] == "custom"
    assert res_rembg.json()["modules"]["rembg_onnx"]["available"] is True

    fake_yt = tmp_path / "yt-dlp.exe"
    fake_yt.write_bytes(b"MZ_FAKE_YTDLP")
    res_yt = client.post(
        "/api/v1/system/configure-module",
        json={"module": "yt_dlp", "path": str(fake_yt)},
    )
    assert res_yt.status_code == 200
    assert res_yt.json()["modules"]["yt_dlp"]["available"] is True
    assert res_yt.json()["modules"]["yt_dlp"]["source"] == "custom"

    # pick_module_binary solo acepta modulos binarios
    res_pick_bad = client.post("/api/v1/system/pick-module-binary", json={"module": "rembg_onnx"})
    assert res_pick_bad.status_code == 400

    # install_module acepta todos los nuevos modulos
    called = []
    monkeypatch.setattr("app.services.system_service._run_install_module_worker", lambda m: called.append(m))
    for mod in ("ffmpeg", "yt_dlp", "rembg_onnx", "whisper_cpu"):
        r_inst = client.post("/api/v1/system/install-module", json={"module": mod})
        assert r_inst.status_code == 200
        assert r_inst.json()["started"] is True
    assert set(called) == {"ffmpeg", "yt_dlp", "rembg_onnx", "whisper_cpu"}

    # Limpiar custom configs
    client.post("/api/v1/system/configure-module", json={"module": "rembg_onnx", "path": ""})
    client.post("/api/v1/system/configure-module", json={"module": "yt_dlp", "path": ""})


def test_install_module_failure_reports_failed_status(monkeypatch):
    import app.services.system_service as sys_svc

    monkeypatch.setattr(sys_svc, "_run_winget_install", lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("winget offline")))
    sys_svc._run_install_module_worker("ffmpeg")

    status_res = client.get("/api/v1/system/status")
    assert status_res.status_code == 200
    ffmpeg_mod = status_res.json()["modules"]["ffmpeg"]
    assert ffmpeg_mod["install_status"] == "failed"
    assert "winget offline" in (ffmpeg_mod["install_message"] or "")

    # Restaurar estado limpio
    sys_svc._install_states["ffmpeg"] = {"status": "idle", "message": None}


def test_job_manager_lifecycle_cancel_sse_and_download(tmp_path):
    # 1. Ciclo completo: crear -> progreso -> completar -> listar -> descargar -> eliminar
    out_file = tmp_path / "result.txt"
    out_file.write_text("resultado tornio", encoding="utf-8")

    job = job_manager.create_job(tool_id="test-tool", studio="pdf", title="Trabajo prueba", input_bytes=100)
    job_manager.start_job(job.id, detail="Procesando")
    job_manager.update_progress(job.id, 55, stage="processing", detail="Mitad")
    job_manager.complete_job(
        job.id,
        output_path=str(out_file),
        output_filename="result.txt",
        output_mime="text/plain",
        detail="Hecho",
    )

    list_res = client.get("/api/v1/jobs/")
    assert list_res.status_code == 200
    jobs_list = list_res.json()["jobs"]
    assert any(j["id"] == job.id for j in jobs_list)
    assert "_output_path" not in jobs_list[0]

    get_res = client.get(f"/api/v1/jobs/{job.id}")
    assert get_res.status_code == 200
    assert get_res.json()["job"]["progress"] == 100
    assert get_res.json()["job"]["status"] == "completed"

    dl_res = client.get(f"/api/v1/jobs/{job.id}/download")
    assert dl_res.status_code == 200
    assert dl_res.text == "resultado tornio"

    # 2. Stream SSE emite evento snapshot valido
    with client.stream("GET", "/api/v1/jobs/stream?max_events=1") as sse_res:
        assert sse_res.status_code == 200
        assert "text/event-stream" in sse_res.headers.get("content-type", "")
        raw_sse = "".join(sse_res.iter_text())
        assert "event: snapshot" in raw_sse
        assert job.id in raw_sse

    del_res = client.delete(f"/api/v1/jobs/{job.id}")
    assert del_res.status_code == 200
    assert del_res.json() == {"deleted": True, "id": job.id}
    assert client.get(f"/api/v1/jobs/{job.id}").status_code == 404

    # 3. Cancelacion real de un subproceso vivo
    cancel_job = job_manager.create_job(tool_id="long-proc", studio="video", title="Cancelable")
    job_manager.start_job(cancel_job.id)
    proc = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(30)"])
    try:
        job_manager.register_process(cancel_job.id, proc)
        cancel_res = client.post(f"/api/v1/jobs/{cancel_job.id}/cancel")
        assert cancel_res.status_code == 200
        assert cancel_res.json()["job"]["status"] == "cancelled"
        assert job_manager.is_cancelled(cancel_job.id) is True
        proc.wait(timeout=5)
        assert proc.poll() is not None
    finally:
        if proc.poll() is None:
            proc.kill()


def test_workspace_inspect_multi_domain_and_range_download(sample_pdf_bytes):
    # 1. PDF
    res_pdf = client.post(
        "/api/v1/workspace/inspect",
        files=[("file", ("contrato.pdf", sample_pdf_bytes, "application/pdf"))],
    )
    assert res_pdf.status_code == 200
    pdf_asset = res_pdf.json()["asset"]
    assert "path" not in pdf_asset
    assert pdf_asset["domain"] == "pdf"
    assert pdf_asset["metadata"]["pages"] == 3
    assert pdf_asset["metadata"]["has_text"] is True
    assert pdf_asset["sha256"] is not None
    assert "compress-pdf" in pdf_asset["suggested_tools"]

    # 2. PNG con EXIF sintetico
    img = Image.new("RGB", (120, 80), color=(30, 120, 220))
    exif = Image.Exif()
    exif[0x010F] = "TornioCam"
    png_buf = io.BytesIO()
    img.save(png_buf, format="PNG", exif=exif.tobytes())
    res_png = client.post(
        "/api/v1/workspace/inspect",
        files=[("file", ("foto.png", png_buf.getvalue(), "image/png"))],
    )
    assert res_png.status_code == 200
    png_asset = res_png.json()["asset"]
    assert png_asset["domain"] == "image"
    assert png_asset["metadata"]["width"] == 120
    assert png_asset["metadata"]["height"] == 80
    assert png_asset["metadata"]["exif_count"] >= 1
    assert "jpg-to-pdf" in png_asset["suggested_tools"]

    # 3. ZIP read-only
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w") as zf:
        zf.writestr("docs/readme.txt", "hola")
        zf.writestr("data/items.json", '{"a": 1}')
    res_zip = client.post(
        "/api/v1/workspace/inspect",
        files=[("file", ("paquete.zip", zip_buf.getvalue(), "application/zip"))],
    )
    assert res_zip.status_code == 200
    zip_asset = res_zip.json()["asset"]
    assert zip_asset["domain"] == "archive"
    assert zip_asset["metadata"]["archive_format"] == "zip"
    assert zip_asset["metadata"]["entry_count"] == 2

    # 4. JSON
    json_bytes = json.dumps({"app": "Tornio", "version": 3, "local": True}).encode("utf-8")
    res_json = client.post(
        "/api/v1/workspace/inspect",
        files=[("file", ("config.json", json_bytes, "application/json"))],
    )
    assert res_json.status_code == 200
    json_asset = res_json.json()["asset"]
    assert json_asset["domain"] == "data"
    assert json_asset["metadata"]["valid"] is True
    assert json_asset["metadata"]["json_type"] == "object"
    assert json_asset["metadata"]["keys_count"] == 3

    # Listar y verificar soporte HTTP Range (206 Partial Content)
    assets_res = client.get("/api/v1/workspace/assets")
    assert assets_res.status_code == 200
    assert len(assets_res.json()["assets"]) == 4

    range_res = client.get(
        f"/api/v1/workspace/assets/{json_asset['id']}/download?inline=true",
        headers={"Range": "bytes=0-9"},
    )
    assert range_res.status_code == 206
    assert range_res.content == json_bytes[:10]
    assert "bytes 0-9/" in range_res.headers.get("content-range", "")

    # Eliminar individual y vaciar
    assert client.delete(f"/api/v1/workspace/assets/{json_asset['id']}").status_code == 200
    clear_res = client.delete("/api/v1/workspace/assets")
    assert clear_res.status_code == 200
    assert clear_res.json()["deleted_count"] == 3


def test_video_endpoints_validation(monkeypatch):
    # Asset inexistente -> 404
    res_404 = client.post("/api/v1/video/process-job", data={"asset_id": "no-existe"})
    assert res_404.status_code in (400, 404)

    # Formato invalido cuando ffmpeg existe o simulado
    monkeypatch.setattr("app.services.media_video.find_ffmpeg", lambda: "ffmpeg.exe")
    res_bad_fmt = client.post(
        "/api/v1/video/process-job",
        files=[("file", ("clip.mp4", b"FAKE_MP4", "video/mp4"))],
        data={"output_format": "avi"},
    )
    assert res_bad_fmt.status_code == 400

    res_bad_time = client.post(
        "/api/v1/video/process-job",
        files=[("file", ("clip.mp4", b"FAKE_MP4", "video/mp4"))],
        data={"output_format": "mp4", "start_sec": "3.0", "end_sec": "1.0"},
    )
    assert res_bad_time.status_code == 400


def test_video_ffmpeg_real_trim_and_chain(tmp_path):
    ffmpeg_bin = find_ffmpeg()
    ffprobe_bin = find_ffprobe()
    if not ffmpeg_bin or not ffprobe_bin:
        pytest.skip("FFmpeg/FFprobe no disponible en este entorno")

    sample_mp4 = tmp_path / "synthetic_test.mp4"
    gen = subprocess.run(
        [
            ffmpeg_bin,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "lavfi",
            "-i",
            "testsrc=duration=2:size=320x240:rate=15",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=440:duration=2",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-shortest",
            str(sample_mp4),
        ],
        capture_output=True,
        text=True,
        timeout=30,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    assert gen.returncode == 0, f"Error generando clip sintetico: {gen.stderr}"

    # 1. Subir a Workspace Inspector
    insp_res = client.post(
        "/api/v1/workspace/inspect",
        files=[("file", ("synthetic_test.mp4", sample_mp4.read_bytes(), "video/mp4"))],
    )
    assert insp_res.status_code == 200
    in_asset = insp_res.json()["asset"]
    assert in_asset["domain"] == "video"
    assert in_asset["metadata"]["width"] == 320
    assert in_asset["metadata"]["height"] == 240
    assert "video-studio" in in_asset["suggested_tools"]

    # 2. Inspeccionar en /api/v1/video/inspect por asset_id
    vid_insp = client.post("/api/v1/video/inspect", data={"asset_id": in_asset["id"]})
    assert vid_insp.status_code == 200
    assert vid_insp.json()["has_video"] is True
    assert vid_insp.json()["has_audio"] is True

    # 3. Ejecutar recorte + reescalado + mute via /api/v1/video/process-job
    job_res = client.post(
        "/api/v1/video/process-job",
        data={
            "asset_id": in_asset["id"],
            "start_sec": "0.2",
            "end_sec": "1.2",
            "output_format": "mp4",
            "quality": "compact",
            "resolution": "480",
            "remove_audio": "true",
            "fast_copy": "false",
        },
    )
    assert job_res.status_code == 202
    job_id = job_res.json()["job"]["id"]

    # Esperar hasta que termine el worker FFmpeg
    deadline = time.time() + 25.0
    final_job = None
    while time.time() < deadline:
        poll = client.get(f"/api/v1/jobs/{job_id}")
        assert poll.status_code == 200
        final_job = poll.json()["job"]
        if final_job["status"] in ("completed", "failed", "cancelled"):
            break
        time.sleep(0.15)

    assert final_job is not None
    assert final_job["status"] == "completed", f"Job fallo: {final_job}"
    assert final_job["progress"] == 100
    assert final_job["output_bytes"] > 0
    assert final_job["output_asset_id"] is not None

    # Descargar y verificar que el asset encadenado existe sin audio
    dl = client.get(f"/api/v1/jobs/{job_id}/download")
    assert dl.status_code == 200
    assert len(dl.content) == final_job["output_bytes"]

    assets_after = client.get("/api/v1/workspace/assets").json()["assets"]
    chained = next((a for a in assets_after if a["id"] == final_job["output_asset_id"]), None)
    assert chained is not None
    assert chained["source_job_id"] == job_id
    assert chained["metadata"]["has_audio"] is False
    assert chained["metadata"]["height"] == 480


def test_jobs_and_workspace_pagination_and_domain_filter(sample_pdf_bytes):
    # Crear 5 jobs y verificar paginacion con limit/offset
    created_ids = []
    for idx in range(5):
        j = job_manager.create_job(
            tool_id="compress-pdf",
            studio="documents",
            title=f"Job {idx}",
            input_bytes=128 + idx,
        )
        created_ids.append(j.id)

    # Sin limit -> retorna todos + metadatos de paginacion backwards-compatible
    res_all = client.get("/api/v1/jobs/").json()
    assert res_all["total"] == 5
    assert len(res_all["jobs"]) == 5
    assert res_all["has_more"] is False
    assert res_all["next_offset"] is None

    # Pagina 1 (limit=2, offset=0)
    res_p1 = client.get("/api/v1/jobs/?limit=2&offset=0").json()
    assert res_p1["total"] == 5
    assert len(res_p1["jobs"]) == 2
    assert res_p1["has_more"] is True
    assert res_p1["next_offset"] == 2
    assert res_p1["jobs"][0]["id"] == created_ids[-1]

    # Pagina 2 (limit=2, offset=2)
    res_p2 = client.get("/api/v1/jobs/?limit=2&offset=2").json()
    assert res_p2["total"] == 5
    assert len(res_p2["jobs"]) == 2
    assert res_p2["has_more"] is True
    assert res_p2["next_offset"] == 4

    # Pagina 3 (limit=2, offset=4)
    res_p3 = client.get("/api/v1/jobs/?limit=2&offset=4").json()
    assert res_p3["total"] == 5
    assert len(res_p3["jobs"]) == 1
    assert res_p3["has_more"] is False
    assert res_p3["next_offset"] is None

    # Subir 3 PDFs y 2 JSONs al workspace y verificar limit/offset/domain
    for i in range(3):
        r = client.post(
            "/api/v1/workspace/inspect",
            files=[("file", (f"doc_{i}.pdf", sample_pdf_bytes, "application/pdf"))],
        )
        assert r.status_code == 200
    for i in range(2):
        r = client.post(
            "/api/v1/workspace/inspect",
            files=[("file", (f"data_{i}.json", b'{"ok": true}', "application/json"))],
        )
        assert r.status_code == 200

    # domain=all retorna los 5
    ws_all = client.get("/api/v1/workspace/assets?domain=all").json()
    assert ws_all["total"] == 5
    assert len(ws_all["assets"]) == 5
    assert ws_all["has_more"] is False
    assert ws_all["next_offset"] is None

    # Filtrado por domain=pdf con paginacion limit=2
    ws_pdf_p1 = client.get("/api/v1/workspace/assets?domain=pdf&limit=2&offset=0").json()
    assert ws_pdf_p1["total"] == 3
    assert len(ws_pdf_p1["assets"]) == 2
    assert ws_pdf_p1["has_more"] is True
    assert ws_pdf_p1["next_offset"] == 2
    assert all(a["domain"] == "pdf" for a in ws_pdf_p1["assets"])

    ws_pdf_p2 = client.get("/api/v1/workspace/assets?domain=pdf&limit=2&offset=2").json()
    assert ws_pdf_p2["total"] == 3
    assert len(ws_pdf_p2["assets"]) == 1
    assert ws_pdf_p2["has_more"] is False
    assert ws_pdf_p2["next_offset"] is None

    ws_data = client.get("/api/v1/workspace/assets?domain=data&limit=10").json()
    assert ws_data["total"] == 2
    assert len(ws_data["assets"]) == 2
    assert ws_data["has_more"] is False
    assert ws_data["next_offset"] is None

