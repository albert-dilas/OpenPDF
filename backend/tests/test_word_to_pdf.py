import pytest
import io
import shutil
import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

LIBREOFFICE_AVAILABLE = (
    shutil.which("soffice") is not None or
    os.path.exists(r"C:\Program Files\LibreOffice\program\soffice.exe")
)

DOCX_MAGIC = b'PK\x03\x04'


def _make_minimal_docx() -> bytes:
    """Crea un DOCX mínimo válido en memoria usando python-docx."""
    try:
        from docx import Document
        doc = Document()
        doc.add_paragraph("Test document for OpenPDF.")
        buf = io.BytesIO()
        doc.save(buf)
        return buf.getvalue()
    except ImportError:
        pytest.skip("python-docx no instalado")


@pytest.mark.skipif(not LIBREOFFICE_AVAILABLE, reason="LibreOffice no instalado")
def test_word_to_pdf_ok():
    docx_bytes = _make_minimal_docx()
    response = client.post(
        "/api/v1/word-to-pdf/",
        files=[("file", ("test.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))],
    )
    assert response.status_code == 200
    assert response.content[:4] == b'%PDF'


def test_word_to_pdf_invalid_content():
    response = client.post(
        "/api/v1/word-to-pdf/",
        files=[("file", ("fake.docx", b'NOT A DOCX', "application/octet-stream"))],
    )
    assert response.status_code == 400
