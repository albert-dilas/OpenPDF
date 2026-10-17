import httpx
from fastapi.testclient import TestClient
from app.main import app
from app.services.system_service import clear_update_cache, DEFAULT_RELEASES_URL

client = TestClient(app)


def test_system_status():
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "2.0.0"
    assert isinstance(data["capabilities"], dict)
    assert isinstance(data["capabilities"]["ocr"], bool)
    assert isinstance(data["capabilities"]["word_to_pdf"], bool)
    assert isinstance(data["ocr_languages"], list)
    assert data["max_file_size_mb"] == 500


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
        "current": "2.0.0",
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
                "tag_name": "v2.0.0",
                "html_url": "https://github.com/albert-dilas/OpenPDF/releases/tag/v2.0.0",
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
    assert calls["count"] == 1  # Segunda llamada servida desde caché


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
        "current": "2.0.0",
        "latest": None,
        "update_available": False,
        "online": False,
        "url": DEFAULT_RELEASES_URL,
    }


def test_system_updates_disabled_by_env(monkeypatch):
    clear_update_cache()
    monkeypatch.setenv("OPENPDF_DISABLE_UPDATE_CHECK", "1")

    async def should_not_be_called(self, url, **kwargs):
        raise AssertionError("No debería realizar llamadas HTTP cuando está desactivado")

    monkeypatch.setattr(httpx.AsyncClient, "get", should_not_be_called)

    response = client.get("/api/v1/system/updates")
    assert response.status_code == 200
    data = response.json()
    assert data["online"] is False
    assert data["latest"] is None
    assert data["update_available"] is False
