"""
Fixtures compartidos para todos los tests de OpenPDF.
El PDF de prueba se genera en memoria con PyMuPDF — no se necesita ningún archivo en disco.
"""
import pytest
import fitz
import io


@pytest.fixture(scope="session")
def sample_pdf_bytes() -> bytes:
    """PDF mínimo válido generado en memoria. Tiene 3 páginas con texto."""
    doc = fitz.open()
    for i in range(3):
        page = doc.new_page(width=595, height=842)  # A4
        page.insert_text((72, 100), f"OpenPDF Test Page {i + 1}", fontsize=14)
        page.insert_text((72, 130), "Texto de prueba para validación de herramientas.", fontsize=10)
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


@pytest.fixture(scope="session")
def sample_pdf_bytes_2() -> bytes:
    """Segundo PDF para pruebas de merge (necesita 2 archivos distintos)."""
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 100), "Segundo PDF para merge.", fontsize=14)
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


@pytest.fixture(scope="session")
def protected_pdf_bytes() -> bytes:
    """PDF protegido con contraseña 'test123' para pruebas de unlock."""
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 100), "PDF protegido.", fontsize=14)
    buf = io.BytesIO()
    doc.save(buf, user_pw="test123", owner_pw="test123", encryption=fitz.PDF_ENCRYPT_AES_256)
    doc.close()
    return buf.getvalue()
