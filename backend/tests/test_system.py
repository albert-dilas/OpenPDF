import httpx
from fastapi.testclient import TestClient
from app.main import app
from app.services.system_service import clear_update_cache, DEFAULT_RELEASES_URL

client = TestClient(app)


def test_system_status():
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "2.2.0"
    assert isinstance(data["capabilities"], dict)
    assert isinstance(data["capabilities"]["ocr"], bool)
    assert isinstance(data["capabilities"]["word_to_pdf"], bool)
    assert isinstance(data["ocr_languages"], list)
    assert data["max_file_size_mb"] == 500
    assert isinstance(data.get("modules"), dict)
    assert "ocr" in data["modules"]
    assert "word_to_pdf" in data["modules"]
    assert isinstance(data["modules"]["winget_available"], bool)


def test_system_updates_online_newer(monkeypatch):
    clear_update_cache()
    monkeypatch.delenv("OPENPDF_DISABLE_UPDATE_CHECK", raising=False)

    class MockResponse:
        status_code = 200

        def json(self):
            return {
                "tag_name": "v2.5.0",
                "html_url": "https://github.com/albert-dilas/OpenPDF/releases/tag/v2.5.0",
            }

    async def mock_get(self, url, **kwargs):
        return MockResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    response = client.get("/api/v1/system/updates")
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "current": "2.2.0",
        "latest": "2.5.0",
        "update_available": True,
        "online": True,
        "url": "https://github.com/albert-dilas/OpenPDF/releases/tag/v2.5.0",
    }


def test_system_updates_online_up_to_date_and_cached(monkeypatch):
    clear_update_cache()
    monkeypatch.delenv("OPENPDF_DISABLE_UPDATE_CHECK", raising=False)
    calls = {"count": 0}

    class MockResponse:
        status_code = 200

        def json(self):
            return {
                "tag_name": "v2.2.0",
                "html_url": "https://github.com/albert-dilas/OpenPDF/releases/tag/v2.2.0",
            }

    async def mock_get(self, url, **kwargs):
        calls["count"] += 1
        return MockResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    res1 = client.get("/api/v1/system/updates")
    res2 = client.get("/api/v1/system/updates")
    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json()["update_available"] is False
    assert res1.json()["online"] is True
    assert calls["count"] == 1  # Segunda llamada servida desde cache


def test_system_updates_offline_fallback(monkeypatch):
    clear_update_cache()
    monkeypatch.delenv("OPENPDF_DISABLE_UPDATE_CHECK", raising=False)

    async def mock_get_fail(self, url, **kwargs):
        raise httpx.ConnectError("No network connection")

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get_fail)

    response = client.get("/api/v1/system/updates")
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "current": "2.2.0",
        "latest": None,
        "update_available": False,
        "online": False,
        "url": DEFAULT_RELEASES_URL,
    }


def test_system_updates_disabled_by_env(monkeypatch):
    clear_update_cache()
    monkeypatch.setenv("OPENPDF_DISABLE_UPDATE_CHECK", "1")

    async def should_not_be_called(self, url, **kwargs):
        raise AssertionError("No deberia realizar llamadas HTTP cuando esta desactivado")

    monkeypatch.setattr(httpx.AsyncClient, "get", should_not_be_called)

    response = client.get("/api/v1/system/updates")
    assert response.status_code == 200
    data = response.json()
    assert data["online"] is False
    assert data["latest"] is None
    assert data["update_available"] is False


def test_system_updates_force_bypass_cache(monkeypatch):
    clear_update_cache()
    monkeypatch.delenv("OPENPDF_DISABLE_UPDATE_CHECK", raising=False)
    calls = {"count": 0}

    class MockResponse:
        status_code = 200

        def json(self):
            return {
                "tag_name": "v2.6.0",
                "html_url": "https://github.com/albert-dilas/OpenPDF/releases/tag/v2.6.0",
            }

    async def mock_get(self, url, **kwargs):
        calls["count"] += 1
        return MockResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    res1 = client.get("/api/v1/system/updates")
    assert res1.status_code == 200
    assert calls["count"] == 1

    # Con force=true debe forzar una nueva llamada ignorando la cache
    res2 = client.get("/api/v1/system/updates?force=true")
    assert res2.status_code == 200
    assert calls["count"] == 2
    assert res2.json()["latest"] == "2.6.0"


def test_system_feedback_endpoint(tmp_path, monkeypatch):
    monkeypatch.setattr("pathlib.Path.home", lambda: tmp_path)

    payload = {
        "category": "feature",
        "title": "Soporte de plugins externos",
        "description": "Me gustaria poder anadir scripts de python personalizados.",
        "email": "user@example.com",
        "system_info": {"os": "windows", "version": "2.2.0"},
    }
    response = client.post("/api/v1/system/feedback", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["stored_locally"] is True

    # Verificar que el archivo local existe y contiene los datos
    log_file = tmp_path / ".openpdf" / "feedback_log.json"
    assert log_file.is_file()
    import json
    entries = json.loads(log_file.read_text(encoding="utf-8"))
    assert len(entries) == 1
    assert entries[0]["title"] == "Soporte de plugins externos"
    assert entries[0]["category"] == "feature"


def test_system_feedback_validation_rejects_empty():
    # Titulo vacio debe ser rechazado
    res1 = client.post("/api/v1/system/feedback", json={
        "category": "feature",
        "title": "   ",
        "description": "Descripcion valida",
    })
    assert res1.status_code == 422

    # Categoria invalida debe ser rechazada
    res2 = client.post("/api/v1/system/feedback", json={
        "category": "malicious_type",
        "title": "Titulo valido",
        "description": "Descripcion suficientemente extensa",
    })
    assert res2.status_code == 422


def test_system_updates_parses_notes_and_assets(monkeypatch):
    clear_update_cache()
    monkeypatch.delenv("OPENPDF_DISABLE_UPDATE_CHECK", raising=False)

    class MockRichResponse:
        status_code = 200

        def json(self):
            return {
                "tag_name": "v3.0.0",
                "name": "OpenPDF v3.0.0 Release",
                "html_url": "https://github.com/albert-dilas/OpenPDF/releases/tag/v3.0.0",
                "body": "Novedades y mejoras importantes.",
                "assets": [
                    {
                        "name": "OpenPDF_Setup_v3.0.0.exe",
                        "browser_download_url": "https://github.com/albert-dilas/OpenPDF/releases/download/v3.0.0/OpenPDF_Setup_v3.0.0.exe",
                    }
                ],
            }

    async def mock_get(self, url, **kwargs):
        return MockRichResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    res = client.get("/api/v1/system/updates?force=true")
    assert res.status_code == 200
    data = res.json()
    assert data["update_available"] is True
    assert data["latest"] == "3.0.0"
    assert data["notes"] == "Novedades y mejoras importantes."
    assert "OpenPDF_Setup_v3.0.0.exe" in data["download_url"]

