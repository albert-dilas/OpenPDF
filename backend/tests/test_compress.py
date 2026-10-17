import os
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)


def test_compress_ok(sample_pdf_bytes):
    response = client.post(
        "/api/v1/compress/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content[:4] == b"%PDF"
    assert "x-original-size" in response.headers
    assert "x-compressed-size" in response.headers
    assert "x-compression-ratio" in response.headers


def test_compress_levels(sample_pdf_bytes):
    for level in ("low", "medium", "high"):
        response = client.post(
            "/api/v1/compress/",
            files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
            data={"level": level},
        )
        assert response.status_code == 200
        assert response.content[:4] == b"%PDF"
        assert int(response.headers["x-original-size"]) == len(sample_pdf_bytes)
        assert int(response.headers["x-compressed-size"]) > 0


def test_compress_invalid_level(sample_pdf_bytes):
    response = client.post(
        "/api/v1/compress/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"level": "extreme"},
    )
    assert response.status_code == 400


def test_compress_invalid_content():
    """Archivo con extensión .pdf pero contenido no-PDF debe ser rechazado."""
    response = client.post(
        "/api/v1/compress/",
        files=[("file", ("fake.pdf", b"NOT A PDF", "application/pdf"))],
    )
    assert response.status_code == 400


def test_compress_file_too_large(monkeypatch):
    """Archivo que supera MAX_FILE_SIZE_BYTES debe ser rechazado en streaming y limpiado de disco."""
    monkeypatch.setattr(settings, "MAX_FILE_SIZE_BYTES", 1024 * 1024)  # 1 MiB
    monkeypatch.setattr(settings, "MAX_FILE_SIZE_MB", 1)

    before_files = set(os.listdir(settings.TEMP_DIR)) if os.path.exists(settings.TEMP_DIR) else set()
    big_content = b"%PDF-" + b"0" * (2 * 1024 * 1024)  # ~2 MiB (> 1 MiB)
    response = client.post(
        "/api/v1/compress/",
        files=[("file", ("big.pdf", big_content, "application/pdf"))],
    )
    assert response.status_code == 400
    after_files = set(os.listdir(settings.TEMP_DIR)) if os.path.exists(settings.TEMP_DIR) else set()
    assert after_files == before_files
