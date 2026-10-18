from fastapi.testclient import TestClient
from app.main import app
from app.utils.binaries import clear_binaries_cache, get_effective_tessdata_dir

client = TestClient(app)


def test_get_modules_and_detect_modules(monkeypatch):
    monkeypatch.setenv("OPENPDF_DISABLE_UPDATE_CHECK", "1")
    res_mod = client.get("/api/v1/system/modules")
    assert res_mod.status_code == 200
    data = res_mod.json()
    assert data["version"] == "2.2.0"
    assert "modules" in data
    assert "ocr" in data["modules"]
    assert "word_to_pdf" in data["modules"]

    res_detect = client.post("/api/v1/system/detect-modules")
    assert res_detect.status_code == 200
    assert res_detect.json()["version"] == "2.2.0"


def test_configure_module_custom_and_reset(tmp_path, monkeypatch):
    cfg_file = tmp_path / "config.json"
    monkeypatch.setenv("OPENPDF_CONFIG_PATH", str(cfg_file))
    clear_binaries_cache()

    fake_tess_dir = tmp_path / "CustomTesseract"
    fake_tess_dir.mkdir()
    fake_tess_exe = fake_tess_dir / "tesseract.exe"
    fake_tess_exe.write_bytes(b"MZ_FAKE_TESSERACT")

    # Configurar pasando carpeta (debe resolver tesseract.exe dentro)
    res_cfg = client.post(
        "/api/v1/system/configure-module",
        json={"module": "ocr", "path": str(fake_tess_dir)},
    )
    assert res_cfg.status_code == 200
    payload = res_cfg.json()
    assert payload["modules"]["ocr"]["available"] is True
    assert payload["modules"]["ocr"]["source"] == "custom"
    assert payload["modules"]["ocr"]["binary_path"] == str(fake_tess_exe.resolve())

    # Restablecer autodeteccion pasando cadena vacia
    res_reset = client.post(
        "/api/v1/system/configure-module",
        json={"module": "ocr", "path": ""},
    )
    assert res_reset.status_code == 200
    assert res_reset.json()["modules"]["ocr"]["source"] == "auto"

    # Ruta invalida debe fallar con BusinessRuleError (400)
    res_bad = client.post(
        "/api/v1/system/configure-module",
        json={"module": "ocr", "path": str(tmp_path / "no_existe_ejecutable.exe")},
    )
    assert res_bad.status_code in (400, 422)


def test_effective_tessdata_sync(tmp_path, monkeypatch):
    user_tessdata = tmp_path / "user_tessdata"
    user_tessdata.mkdir()
    (user_tessdata / "spa.traineddata").write_bytes(b"SPA_MODEL" * 200)
    monkeypatch.setenv("OPENPDF_TESSDATA_DIR", str(user_tessdata))

    sys_tess_root = tmp_path / "ProgramFilesTesseract"
    sys_tessdata = sys_tess_root / "tessdata"
    sys_tessdata.mkdir(parents=True)
    fake_tess_bin = sys_tess_root / "tesseract.exe"
    fake_tess_bin.write_bytes(b"MZ")
    (sys_tessdata / "eng.traineddata").write_bytes(b"ENG_MODEL" * 200)
    (sys_tessdata / "osd.traineddata").write_bytes(b"OSD_MODEL" * 200)

    effective = get_effective_tessdata_dir(str(fake_tess_bin))
    assert effective == str(user_tessdata)
    assert (user_tessdata / "eng.traineddata").is_file()
    assert (user_tessdata / "osd.traineddata").is_file()


def test_install_module_endpoint_mocked(monkeypatch):
    called = []

    def fake_worker(module: str) -> None:
        called.append(module)

    monkeypatch.setattr("app.services.system_service._run_install_module_worker", fake_worker)

    res = client.post("/api/v1/system/install-module", json={"module": "ocr_lang_spa"})
    assert res.status_code == 200
    body = res.json()
    assert body["started"] is True
    assert body["module"] == "ocr_lang_spa"

    res_invalid = client.post("/api/v1/system/install-module", json={"module": "unknown_mod"})
    assert res_invalid.status_code in (400, 422)
