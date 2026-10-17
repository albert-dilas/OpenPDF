"""Tests de empaquetado y dependencias críticas para PyInstaller (python-multipart, Form)."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_python_multipart_importable():
    """Verifica que python_multipart esté instalado e importable sin usar el paquete deprecado multipart."""
    import python_multipart

    assert hasattr(python_multipart, "__version__")


def test_form_endpoint_works(sample_pdf_bytes):
    """Verifica que un endpoint que usa Form + File procese multipart/form-data correctamente."""
    response = client.post(
        "/api/v1/rotate/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"degrees": "90"},
    )
    assert response.status_code == 200
    assert response.content[:4] == b"%PDF"
