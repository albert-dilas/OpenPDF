from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

DOCX_MAGIC = b'PK\x03\x04'


def test_pdf_to_word_ok(sample_pdf_bytes):
    response = client.post(
        "/api/v1/pdf-to-word/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
    )
    assert response.status_code == 200
    # DOCX es un ZIP, comienza con PK
    assert response.content[:4] == DOCX_MAGIC


def test_pdf_to_word_invalid_content():
    response = client.post(
        "/api/v1/pdf-to-word/",
        files=[("file", ("fake.pdf", b'NOT A PDF', "application/pdf"))],
    )
    assert response.status_code == 400
