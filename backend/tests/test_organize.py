import json
import fitz
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_organize_reorder_rotate_and_delete(sample_pdf_bytes):
    # sample_pdf_bytes tiene 3 páginas (0, 1, 2). Extraemos [2 (rot 90), 0 (rot 180)], omitiendo la 1.
    pages_payload = json.dumps([
        {"index": 2, "rotation": 90},
        {"index": 0, "rotation": 180},
    ])
    response = client.post(
        "/api/v1/organize/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"pages": pages_payload},
    )
    assert response.status_code == 200
    assert response.content[:4] == b"%PDF"

    doc = fitz.open(stream=response.content, filetype="pdf")
    try:
        assert len(doc) == 2
        assert "Page 3" in doc[0].get_text()
        assert doc[0].rotation == 90
        assert "Page 1" in doc[1].get_text()
        assert doc[1].rotation == 180
    finally:
        doc.close()


def test_organize_invalid_json(sample_pdf_bytes):
    response = client.post(
        "/api/v1/organize/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"pages": "not-valid-json"},
    )
    assert response.status_code == 400


def test_organize_empty_list(sample_pdf_bytes):
    response = client.post(
        "/api/v1/organize/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"pages": "[]"},
    )
    assert response.status_code == 400


def test_organize_index_out_of_range(sample_pdf_bytes):
    response = client.post(
        "/api/v1/organize/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"pages": json.dumps([{"index": 10, "rotation": 0}])},
    )
    assert response.status_code == 400


def test_organize_invalid_rotation(sample_pdf_bytes):
    response = client.post(
        "/api/v1/organize/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"pages": json.dumps([{"index": 0, "rotation": 45}])},
    )
    assert response.status_code == 400
