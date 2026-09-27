from fastapi.testclient import TestClient
from app.main import app
import fitz

client = TestClient(app)


def test_unlock_ok(protected_pdf_bytes):
    response = client.post(
        "/api/v1/unlock/",
        files=[("file", ("protected.pdf", protected_pdf_bytes, "application/pdf"))],
        data={"password": "test123"},
    )
    assert response.status_code == 200
    assert response.content[:4] == b'%PDF'
    # El PDF resultante no debe estar encriptado
    doc = fitz.open(stream=response.content, filetype="pdf")
    assert not doc.is_encrypted
    doc.close()


def test_unlock_wrong_password(protected_pdf_bytes):
    response = client.post(
        "/api/v1/unlock/",
        files=[("file", ("protected.pdf", protected_pdf_bytes, "application/pdf"))],
        data={"password": "wrong_password"},
    )
    assert response.status_code == 400


def test_unlock_unprotected_pdf(sample_pdf_bytes):
    """Un PDF no protegido debe devolverse tal cual sin error."""
    response = client.post(
        "/api/v1/unlock/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"password": "cualquier_cosa"},
    )
    assert response.status_code == 200
