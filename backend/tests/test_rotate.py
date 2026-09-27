from fastapi.testclient import TestClient
import os
from app.main import app

client = TestClient(app)

def test_rotate_endpoint_90():
    assert os.path.exists('test1.pdf'), "Falta test1.pdf en backend/"
    with open('test1.pdf', 'rb') as f:
        response = client.post(
            "/api/v1/rotate/",
            files=[("file", ("test1.pdf", f, "application/pdf"))],
            data={"degrees": "90"},
        )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content[:4] == b'%PDF'

def test_rotate_endpoint_180():
    assert os.path.exists('test1.pdf'), "Falta test1.pdf en backend/"
    with open('test1.pdf', 'rb') as f:
        response = client.post(
            "/api/v1/rotate/",
            files=[("file", ("test1.pdf", f, "application/pdf"))],
            data={"degrees": "180"},
        )
    assert response.status_code == 200

def test_rotate_invalid_file():
    fake_pdf = b'NOT A PDF FILE CONTENT'
    response = client.post(
        "/api/v1/rotate/",
        files=[("file", ("fake.pdf", fake_pdf, "application/pdf"))],
        data={"degrees": "90"},
    )
    assert response.status_code == 400
