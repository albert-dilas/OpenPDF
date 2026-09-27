from fastapi.testclient import TestClient
from app.main import app
import io
from PIL import Image

client = TestClient(app)


def _make_jpg_bytes() -> bytes:
    """Crea una imagen JPEG mínima válida en memoria."""
    img = Image.new("RGB", (100, 100), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_jpg_to_pdf_ok():
    jpg_bytes = _make_jpg_bytes()
    response = client.post(
        "/api/v1/jpg-to-pdf/",
        files=[("files", ("image.jpg", jpg_bytes, "image/jpeg"))],
    )
    assert response.status_code == 200
    assert response.content[:4] == b'%PDF'


def test_jpg_to_pdf_invalid_content():
    """Un archivo con extensión .jpg pero contenido inválido debe ser rechazado."""
    response = client.post(
        "/api/v1/jpg-to-pdf/",
        files=[("files", ("fake.jpg", b'NOT AN IMAGE', "image/jpeg"))],
    )
    assert response.status_code == 400
