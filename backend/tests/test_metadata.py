import fitz
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_metadata_update_and_preserve(sample_pdf_bytes):
    # 1. Actualizar todos los campos
    response = client.post(
        "/api/v1/metadata/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={
            "title": "Documento Privado",
            "author": "Ada Lovelace",
            "subject": "Criptografía",
            "keywords": "pdf, local, openpdf",
        },
    )
    assert response.status_code == 200
    updated_bytes = response.content

    doc = fitz.open(stream=updated_bytes, filetype="pdf")
    try:
        assert doc.metadata["title"] == "Documento Privado"
        assert doc.metadata["author"] == "Ada Lovelace"
        assert doc.metadata["subject"] == "Criptografía"
        assert doc.metadata["keywords"] == "pdf, local, openpdf"
    finally:
        doc.close()

    # 2. Actualizar solo subject y limpiar keywords="", dejando title y author en None (sin tocar)
    response2 = client.post(
        "/api/v1/metadata/",
        files=[("file", ("updated.pdf", updated_bytes, "application/pdf"))],
        data={
            "subject": "Nuevo Asunto",
            "keywords": "",
        },
    )
    assert response2.status_code == 200
    doc2 = fitz.open(stream=response2.content, filetype="pdf")
    try:
        assert doc2.metadata["title"] == "Documento Privado"
        assert doc2.metadata["author"] == "Ada Lovelace"
        assert doc2.metadata["subject"] == "Nuevo Asunto"
        assert doc2.metadata["keywords"] == ""
    finally:
        doc2.close()


def test_metadata_encrypted_rejected(protected_pdf_bytes):
    response = client.post(
        "/api/v1/metadata/",
        files=[("file", ("protected.pdf", protected_pdf_bytes, "application/pdf"))],
        data={"title": "No permitido"},
    )
    assert response.status_code == 400
