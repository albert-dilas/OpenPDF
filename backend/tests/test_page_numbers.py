from fastapi.testclient import TestClient
from app.main import app
import fitz, io

client = TestClient(app)


def test_page_numbers_ok(sample_pdf_bytes):
    response = client.post(
        "/api/v1/page-numbers/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
    )
    assert response.status_code == 200
    assert response.content[:4] == b'%PDF'


def test_page_numbers_verifica_texto(sample_pdf_bytes):
    """Verificar que el PDF resultante contiene '1' como número de página."""
    response = client.post(
        "/api/v1/page-numbers/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
    )
    assert response.status_code == 200
    doc = fitz.open(stream=response.content, filetype="pdf")
    first_page_text = doc[0].get_text()
    doc.close()
    assert "1" in first_page_text


def test_page_numbers_invalid_content():
    response = client.post(
        "/api/v1/page-numbers/",
        files=[("file", ("fake.pdf", b'NOT A PDF', "application/pdf"))],
    )
    assert response.status_code == 400
