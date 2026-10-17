"""Pruebas de integración y seguridad para las 5 nuevas herramientas de OpenPDF v2.1.0."""
import io
import fitz
import httpx
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
import app.utils.network as network_utils

client = TestClient(app)


def _create_signature_png_bytes() -> bytes:
    img = Image.new("RGBA", (240, 90), (255, 255, 255, 0))
    for x in range(20, 220):
        img.putpixel((x, 45), (15, 23, 42, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _create_sensitive_pdf_bytes() -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((72, 100), "Contrato Confidencial - CLAVE-SECRETA-7788", fontsize=12)
    page.insert_text((72, 130), "Contacto: soporte@corporacion.com | Tel: +51 987-654-321", fontsize=11)
    page.insert_text((72, 160), "Documento público que debe conservarse.", fontsize=11)
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def test_sign_pdf_success(sample_pdf_bytes):
    sig_bytes = _create_signature_png_bytes()
    response = client.post(
        "/api/v1/sign/",
        files=[
            ("file", ("doc.pdf", sample_pdf_bytes, "application/pdf")),
            ("signature", ("firma.png", sig_bytes, "image/png")),
        ],
        data={
            "pages": "1,3",
            "position": "bottom-right",
            "scale": "0.25",
            "label_text": "Firmado por Dirección Técnica",
        },
    )
    assert response.status_code == 200
    assert response.content[:4] == b"%PDF"

    out_doc = fitz.open(stream=response.content, filetype="pdf")
    try:
        assert len(out_doc) == 3
        assert len(out_doc[0].get_images()) >= 1
        assert len(out_doc[1].get_images()) == 0
        assert len(out_doc[2].get_images()) >= 1
        assert "Firmado por Dirección Técnica" in out_doc[0].get_text("text")
    finally:
        out_doc.close()


def test_sign_pdf_rejects_encrypted(protected_pdf_bytes):
    sig_bytes = _create_signature_png_bytes()
    response = client.post(
        "/api/v1/sign/",
        files=[
            ("file", ("locked.pdf", protected_pdf_bytes, "application/pdf")),
            ("signature", ("firma.png", sig_bytes, "image/png")),
        ],
        data={"pages": "last"},
    )
    assert response.status_code == 400
    assert "contraseña" in response.json()["detail"].lower()


def test_redact_pdf_purges_sensitive_text():
    pdf_bytes = _create_sensitive_pdf_bytes()
    response = client.post(
        "/api/v1/redact/",
        files=[("file", ("sensitive.pdf", pdf_bytes, "application/pdf"))],
        data={
            "terms": "CLAVE-SECRETA-7788",
            "redact_emails": "true",
            "redact_phones": "true",
            "fill_color": "black",
        },
    )
    assert response.status_code == 200
    assert response.content[:4] == b"%PDF"
    redacted_count = int(response.headers.get("x-redacted-count", "0"))
    assert redacted_count >= 3

    out_doc = fitz.open(stream=response.content, filetype="pdf")
    try:
        extracted = out_doc[0].get_text("text")
        assert "CLAVE-SECRETA-7788" not in extracted
        assert "soporte@corporacion.com" not in extracted
        assert "987-654-321" not in extracted
        assert "Documento público que debe conservarse." in extracted
    finally:
        out_doc.close()


def test_redact_pdf_requires_criteria(sample_pdf_bytes):
    response = client.post(
        "/api/v1/redact/",
        files=[("file", ("doc.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"terms": ""},
    )
    assert response.status_code == 400


@pytest.mark.parametrize(
    "blocked_url",
    [
        "http://127.0.0.1:8000/health",
        "http://localhost:3000",
        "http://192.168.1.1/admin",
        "http://10.0.0.1/secret",
        "http://169.254.169.254/latest/meta-data/",
        "file:///C:/Windows/win.ini",
    ],
)
def test_url_to_pdf_blocks_ssrf(blocked_url):
    response = client.post(
        "/api/v1/url-to-pdf/",
        data={"url": blocked_url, "mode": "reader", "page_size": "a4"},
    )
    assert response.status_code == 400


def test_url_to_pdf_renders_html_article(monkeypatch):
    monkeypatch.setattr(
        network_utils,
        "validate_public_http_url",
        lambda u: u if u.startswith("http") else f"https://{u}",
    )
    import app.services.url_to_pdf as url_service_mod

    monkeypatch.setattr(
        url_service_mod,
        "validate_public_http_url",
        lambda u: u if u.startswith("http") else f"https://{u}",
    )

    sample_html = b"""
    <!DOCTYPE html>
    <html>
      <head><title>Guia Tecnica OpenPDF</title></head>
      <body>
        <article>
          <h1>Arquitectura Local-First</h1>
          <p>Este articulo describe el procesamiento documental seguro y privado.</p>
          <h2>Ventajas Principales</h2>
          <ul>
            <li>Cero telemetria externa en modulos locales.</li>
            <li>Renderizado vectorial de alta velocidad.</li>
          </ul>
        </article>
      </body>
    </html>
    """

    class MockResponse:
        status_code = 200
        url = httpx.URL("https://example.org/guia")
        headers = {"content-type": "text/html; charset=utf-8"}
        encoding = "utf-8"
        content = sample_html

    async def mock_get(self, url, **kwargs):
        return MockResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    response = client.post(
        "/api/v1/url-to-pdf/",
        data={"url": "https://example.org/guia", "mode": "reader", "page_size": "a4"},
    )
    assert response.status_code == 200
    assert response.content[:4] == b"%PDF"

    doc = fitz.open(stream=response.content, filetype="pdf")
    try:
        text = doc[0].get_text("text")
        assert "Guia Tecnica OpenPDF" in text
        assert "Arquitectura Local-First" in text
    finally:
        doc.close()


def test_translate_pdf_success(monkeypatch, sample_pdf_bytes):
    class MockTranslateResponse:
        status_code = 200

        def json(self):
            return [[["Texto traducido al ingles correctamente.", "Texto original", None, None, 10]]]

    async def mock_get(self, url, **kwargs):
        return MockTranslateResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    response = client.post(
        "/api/v1/translate/",
        files=[("file", ("test.pdf", sample_pdf_bytes, "application/pdf"))],
        data={"source_lang": "es", "target_lang": "en", "mode": "bilingual"},
    )
    assert response.status_code == 200
    assert response.content[:4] == b"%PDF"
    assert int(response.headers.get("x-translated-pages", "0")) == 3

    doc = fitz.open(stream=response.content, filetype="pdf")
    try:
        text = doc[0].get_text("text")
        assert "Texto traducido al ingles correctamente." in text
    finally:
        doc.close()


def test_qr_stamp_and_inspect_roundtrip(monkeypatch, sample_pdf_bytes):
    async def mock_check_url(raw_url: str, timeout: float = 5.0):
        return {
            "url": "https://albert-dilas.github.io/OpenPDF/",
            "final_url": "https://albert-dilas.github.io/OpenPDF/",
            "reachable": True,
            "status_code": 200,
            "content_type": "text/html",
            "title": "OpenPDF Web",
            "elapsed_ms": 42,
            "error": None,
        }

    import app.services.pdf_qr as pdf_qr_mod
    import app.api.v1.endpoints.qr as qr_endpoint_mod

    monkeypatch.setattr(pdf_qr_mod, "check_url_reachability", mock_check_url)
    monkeypatch.setattr(qr_endpoint_mod, "check_url_reachability", mock_check_url)

    # 1. Verificar endpoint /qr/verify-url
    verify_res = client.post(
        "/api/v1/qr/verify-url",
        data={"url": "https://albert-dilas.github.io/OpenPDF/"},
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["reachable"] is True

    # 2. Estampar QR en la primera página
    stamp_res = client.post(
        "/api/v1/qr/stamp",
        files=[("file", ("doc.pdf", sample_pdf_bytes, "application/pdf"))],
        data={
            "payload": "https://albert-dilas.github.io/OpenPDF/",
            "verify_online": "true",
            "pages": "first",
            "position": "bottom-right",
            "scale": "0.22",
            "label_text": "Verificado Online",
        },
    )
    assert stamp_res.status_code == 200
    assert stamp_res.headers.get("x-qr-verified") == "true"
    stamped_pdf = stamp_res.content

    # 3. Inspeccionar el PDF recién estampado y verificar que detecta el código QR
    inspect_res = client.post(
        "/api/v1/qr/inspect",
        files=[("file", ("stamped.pdf", stamped_pdf, "application/pdf"))],
        data={"verify_online": "true"},
    )
    assert inspect_res.status_code == 200
    payload = inspect_res.json()
    assert payload["qr_count"] >= 1
    assert payload["items"][0]["page"] == 1
    assert payload["items"][0]["data"] == "https://albert-dilas.github.io/OpenPDF/"
    assert payload["items"][0]["online_check"]["reachable"] is True
