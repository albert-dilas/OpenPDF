from fastapi.testclient import TestClient
import os
from app.main import app

client = TestClient(app)

def test_protect_endpoint():
    assert os.path.exists('test1.pdf'), "Falta test1.pdf en backend/"
    with open('test1.pdf', 'rb') as f:
        response = client.post(
            "/api/v1/protect/",
            files=[("file", ("test1.pdf", f, "application/pdf"))],
            data={"password": "test123"},
        )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content[:4] == b'%PDF'

def test_protect_missing_password():
    assert os.path.exists('test1.pdf'), "Falta test1.pdf en backend/"
    with open('test1.pdf', 'rb') as f:
        response = client.post(
            "/api/v1/protect/",
            files=[("file", ("test1.pdf", f, "application/pdf"))],
        )
    assert response.status_code == 422

def test_protect_invalid_file():
    fake_pdf = b'NOT A PDF FILE CONTENT'
    response = client.post(
        "/api/v1/protect/",
        files=[("file", ("fake.pdf", fake_pdf, "application/pdf"))],
        data={"password": "test123"},
    )
    assert response.status_code == 400
