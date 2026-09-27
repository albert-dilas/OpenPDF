from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_pdf_to_markdown_ok(sample_pdf_bytes):
    response = client.post(
        "/api/v1/pdf-to-markdown/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
    )
    assert response.status_code == 200
    # El archivo Markdown debe contener el texto que pusimos en el PDF de prueba
    content = response.content.decode("utf-8", errors="replace")
    assert "OpenPDF Test Page" in content


def test_pdf_to_markdown_invalid_content():
    response = client.post(
        "/api/v1/pdf-to-markdown/",
        files=[("file", ("fake.pdf", b'NOT A PDF', "application/pdf"))],
    )
    assert response.status_code == 400
