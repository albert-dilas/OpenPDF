from fastapi.testclient import TestClient
from app.main import app
import fitz, io

client = TestClient(app)


def test_protect_ok(sample_pdf_bytes):
    response = client.post(
        "/api/v1/protect/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"password": "secret123"},
    )
    assert response.status_code == 200
    # El PDF protegido debe seguir siendo un PDF válido
    assert response.content[:4] == b'%PDF'
    # Verificar que está encriptado abriendo con PyMuPDF
    doc = fitz.open(stream=response.content, filetype="pdf")
    assert doc.is_encrypted
    doc.close()


def test_protect_invalid_content():
    response = client.post(
        "/api/v1/protect/",
        files=[("file", ("fake.pdf", b'NOT A PDF', "application/pdf"))],
        data={"password": "secret"},
    )
    assert response.status_code == 400
