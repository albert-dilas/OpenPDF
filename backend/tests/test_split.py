from fastapi.testclient import TestClient
import os
import zipfile
import io
from app.main import app

client = TestClient(app)

def test_split_endpoint():
    assert os.path.exists('test1.pdf'), "Falta test1.pdf en backend/"
    with open('test1.pdf', 'rb') as f:
        response = client.post(
            "/api/v1/split/",
            files=[("file", ("test1.pdf", f, "application/pdf"))],
        )
    assert response.status_code == 200
    zf = zipfile.ZipFile(io.BytesIO(response.content))
    assert len(zf.namelist()) >= 1

def test_split_invalid_file():
    fake_pdf = b'NOT A PDF FILE CONTENT'
    response = client.post(
        "/api/v1/split/",
        files=[("file", ("fake.pdf", fake_pdf, "application/pdf"))],
    )
    assert response.status_code == 400
