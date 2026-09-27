from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_merge_ok(sample_pdf_bytes, sample_pdf_bytes_2):
    response = client.post(
        "/api/v1/merge/",
        files=[
            ("files", ("a.pdf", sample_pdf_bytes, "application/pdf")),
            ("files", ("b.pdf", sample_pdf_bytes_2, "application/pdf")),
        ],
    )
    assert response.status_code == 200
    assert response.content[:4] == b'%PDF'


def test_merge_single_file_rejected(sample_pdf_bytes):
    """Enviar solo 1 archivo debe devolver error de regla de negocio."""
    response = client.post(
        "/api/v1/merge/",
        files=[("files", ("a.pdf", sample_pdf_bytes, "application/pdf"))],
    )
    assert response.status_code == 400


def test_merge_invalid_content(sample_pdf_bytes):
    """Un archivo con contenido no-PDF en el batch debe ser rechazado."""
    response = client.post(
        "/api/v1/merge/",
        files=[
            ("files", ("a.pdf", sample_pdf_bytes, "application/pdf")),
            ("files", ("b.pdf", b'NOT PDF', "application/pdf")),
        ],
    )
    assert response.status_code == 400
