from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_pdf_info_normal(sample_pdf_bytes):
    response = client.post(
        "/api/v1/pdf-info/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["page_count"] == 3
    assert data["encrypted"] is False
    assert set(data["metadata"].keys()) == {
        "title",
        "author",
        "subject",
        "keywords",
        "creator",
        "producer",
    }
    assert len(data["pages"]) == 3
    first_page = data["pages"][0]
    assert first_page["index"] == 0
    assert first_page["width"] == 595.0
    assert first_page["height"] == 842.0
    assert first_page["rotation"] == 0
    assert isinstance(first_page["thumbnail"], str)
    assert first_page["thumbnail"].startswith("data:image/jpeg;base64,")


def test_pdf_info_encrypted(protected_pdf_bytes):
    response = client.post(
        "/api/v1/pdf-info/",
        files=[("file", ("protected.pdf", protected_pdf_bytes, "application/pdf"))],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["encrypted"] is True
    assert data["pages"] == []
    assert all(v == "" for v in data["metadata"].values())


def test_pdf_info_invalid_content():
    response = client.post(
        "/api/v1/pdf-info/",
        files=[("file", ("fake.pdf", b"NOT A PDF", "application/pdf"))],
    )
    assert response.status_code == 400
