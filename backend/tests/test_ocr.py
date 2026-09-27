import pytest
import shutil
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Detectar si Tesseract está disponible
TESSERACT_AVAILABLE = (
    shutil.which("tesseract") is not None or
    __import__("os").path.exists(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
)


@pytest.mark.skipif(not TESSERACT_AVAILABLE, reason="Tesseract no instalado")
def test_ocr_ok(sample_pdf_bytes):
    response = client.post(
        "/api/v1/ocr/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"language": "eng"},
    )
    assert response.status_code == 200
    assert response.content[:4] == b'%PDF'


def test_ocr_invalid_content():
    response = client.post(
        "/api/v1/ocr/",
        files=[("file", ("fake.pdf", b'NOT A PDF', "application/pdf"))],
        data={"language": "spa"},
    )
    assert response.status_code == 400
