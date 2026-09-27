from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_split_ok_returns_zip(sample_pdf_bytes):
    response = client.post(
        "/api/v1/split/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    # Verificar que el ZIP comienza con la firma PK
    assert response.content[:2] == b'PK'


def test_split_invalid_content():
    response = client.post(
        "/api/v1/split/",
        files=[("file", ("fake.pdf", b'NOT A PDF', "application/pdf"))],
    )
    assert response.status_code == 400
