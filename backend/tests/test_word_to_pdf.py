import pytest
import io
from fastapi.testclient import TestClient
from app.main import app
from app.utils.binaries import find_soffice, find_msword

client = TestClient(app)

WORD_CONVERTER_AVAILABLE = (find_soffice() or find_msword()) is not None

DOCX_MAGIC = b"PK\x03\x04"


def _make_minimal_docx() -> bytes:
    """Crea un DOCX minimo valido en memoria usando python-docx."""
    try:
        from docx import Document
        doc = Document()
        doc.add_paragraph("Test document for OpenPDF.")
        buf = io.BytesIO()
        doc.save(buf)
        return buf.getvalue()
    except ImportError:
        pytest.skip("python-docx no instalado")


@pytest.mark.skipif(not WORD_CONVERTER_AVAILABLE, reason="Ni LibreOffice ni MS Word estan instalados")
def test_word_to_pdf_ok():
    docx_bytes = _make_minimal_docx()
    response = client.post(
        "/api/v1/word-to-pdf/",
        files=[("file", ("test.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))],
    )
    assert response.status_code == 200
    assert response.content[:4] == b"%PDF"


def test_word_to_pdf_invalid_content():
    response = client.post(
        "/api/v1/word-to-pdf/",
        files=[("file", ("fake.docx", b"NOT A DOCX", "application/octet-stream"))],
    )
    assert response.status_code == 400
