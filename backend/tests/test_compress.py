from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_compress_ok(sample_pdf_bytes):
    response = client.post(
        "/api/v1/compress/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content[:4] == b'%PDF'


def test_compress_invalid_content():
    """Archivo con extensión .pdf pero contenido no-PDF debe ser rechazado."""
    response = client.post(
        "/api/v1/compress/",
        files=[("file", ("fake.pdf", b'NOT A PDF', "application/pdf"))],
    )
    assert response.status_code == 400


def test_compress_file_too_large():
    """Archivo que supera el límite de 500 MB debe ser rechazado."""
    # Simulamos con 501 MB de datos (el encabezado %PDF hace válido el magic check)
    big_content = b'%PDF' + b'0' * (501 * 1024 * 1024)
    response = client.post(
        "/api/v1/compress/",
        files=[("file", ("big.pdf", big_content, "application/pdf"))],
    )
    assert response.status_code == 400
