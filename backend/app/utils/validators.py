"""Validadores de archivos por contenido (magic bytes)."""

PDF_MAGIC = b'%PDF'
JPEG_MAGIC = b'\xff\xd8\xff'
PNG_MAGIC = b'\x89PNG'
DOCX_MAGIC = b'PK\x03\x04'  # ZIP (DOCX son ZIPs)
DOC_MAGIC = b'\xd0\xcf\x11\xe0'  # OLE2 Compound Document


def validate_pdf_bytes(content: bytes) -> bool:
    """Verifica que el contenido sea un PDF real por sus magic bytes."""
    return content[:4] == PDF_MAGIC


def validate_image_bytes(content: bytes) -> bool:
    """Verifica que el contenido sea una imagen JPG o PNG."""
    return content[:3] == JPEG_MAGIC or content[:4] == PNG_MAGIC


def validate_word_bytes(content: bytes) -> bool:
    """Verifica que el contenido sea un archivo Word (.docx o .doc)."""
    return content[:4] == DOCX_MAGIC or content[:4] == DOC_MAGIC
