import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.binaries import find_tesseract

client = TestClient(app)

TESSERACT_AVAILABLE = find_tesseract() is not None


@pytest.mark.skipif(not TESSERACT_AVAILABLE, reason="Tesseract no instalado")
def test_ocr_ok(sample_pdf_bytes):
    response = client.post(
        "/api/v1/ocr/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"language": "eng"},
    )
    assert response.status_code == 200
    assert response.content[:4] == b"%PDF"


def test_ocr_invalid_content():
    response = client.post(
        "/api/v1/ocr/",
        files=[("file", ("fake.pdf", b"NOT A PDF", "application/pdf"))],
        data={"language": "spa"},
    )
    assert response.status_code == 400


def test_ocr_invalid_language_format(sample_pdf_bytes):
    response = client.post(
        "/api/v1/ocr/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"language": "spa; rm -rf /"},
    )
    assert response.status_code == 400


def test_ocr_uninstalled_language_rejected(sample_pdf_bytes, monkeypatch):
    monkeypatch.setattr("app.services.ocr_pdf.get_ocr_languages", lambda: ["eng"])
    response = client.post(
        "/api/v1/ocr/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"language": "deu"},
    )
    assert response.status_code == 400
