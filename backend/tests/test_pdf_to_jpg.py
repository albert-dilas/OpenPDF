from fastapi.testclient import TestClient
import os
import zipfile
import io
from app.main import app

client = TestClient(app)

def test_pdf_to_jpg_endpoint():
    assert os.path.exists('test1.pdf'), "Falta test1.pdf en backend/"
    with open('test1.pdf', 'rb') as f:
        response = client.post(
            "/api/v1/pdf-to-jpg/",
            files=[("file", ("test1.pdf", f, "application/pdf"))],
        )
    assert response.status_code == 200
    zf = zipfile.ZipFile(io.BytesIO(response.content))
    assert len(zf.namelist()) >= 1
    for name in zf.namelist():
        assert name.lower().endswith('.jpg'), f"Archivo inesperado en ZIP: {name}"

def test_pdf_to_jpg_invalid_file():
    fake_pdf = b'NOT A PDF FILE CONTENT'
    response = client.post(
        "/api/v1/pdf-to-jpg/",
        files=[("file", ("fake.pdf", fake_pdf, "application/pdf"))],
    )
    assert response.status_code == 400
