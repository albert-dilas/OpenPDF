"""Pruebas de integracion para las 35 herramientas de Fase 2 y el motor de Pipelines de Tornio v3.0."""

from __future__ import annotations

import io
import json
import pytest
from fastapi.testclient import TestClient
from PIL import Image
import pymupdf
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def _make_sample_pdf(text: str = "Factura Cliente\nProducto   Cantidad   Total\nLicencia   2          150.00") -> bytes:
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 72), text, fontsize=12)
    data = doc.tobytes()
    doc.close()
    return data


def _make_sample_png() -> bytes:
    img = Image.new("RGB", (120, 90), (240, 240, 245))
    for x in range(35, 85):
        for y in range(25, 65):
            img.putpixel((x, y), (224, 72, 38))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_pdf_extras_endpoints(client):
    pdf_a = _make_sample_pdf("Revision 1\nLinea original")
    pdf_b = _make_sample_pdf("Revision 2\nLinea modificada")

    # 1. pdf-diff
    res_diff = client.post(
        "/api/v1/tools/pdf-diff",
        files=[
            ("files", ("rev_a.pdf", pdf_a, "application/pdf")),
            ("files", ("rev_b.pdf", pdf_b, "application/pdf")),
        ],
    )
    assert res_diff.status_code == 200
    assert res_diff.content.startswith(b"%PDF")

    # 2. pdf-tables-csv
    res_csv = client.post(
        "/api/v1/tools/pdf-tables-csv",
        files={"file": ("factura.pdf", _make_sample_pdf(), "application/pdf")},
    )
    assert res_csv.status_code == 200
    assert "Producto" in res_csv.text

    # 3. pdf-repair
    res_rep = client.post(
        "/api/v1/tools/pdf-repair",
        files={"file": ("doc.pdf", pdf_a, "application/pdf")},
    )
    assert res_rep.status_code == 200
    assert res_rep.content.startswith(b"%PDF")


def test_image_studio_endpoints(client):
    png_bytes = _make_sample_png()

    # 1. image-convert + document_scan enhancer
    res_conv = client.post(
        "/api/v1/tools/image-convert",
        files={"file": ("nota.png", png_bytes, "image/png")},
        data={"target_format": "webp", "enhance_mode": "document_scan"},
    )
    assert res_conv.status_code == 200
    assert len(res_conv.content) > 30

    # 2. image-compress
    res_comp = client.post(
        "/api/v1/tools/image-compress",
        files={"file": ("foto.png", png_bytes, "image/png")},
        data={"quality_level": "high"},
    )
    assert res_comp.status_code == 200

    # 3. image-resize-crop
    res_crop = client.post(
        "/api/v1/tools/image-resize-crop",
        files={"file": ("foto.png", png_bytes, "image/png")},
        data={"width": "64", "height": "64", "mode": "crop"},
    )
    assert res_crop.status_code == 200

    # 4. image-exif-strip
    res_exif = client.post(
        "/api/v1/tools/image-exif-strip",
        files={"file": ("foto.png", png_bytes, "image/png")},
    )
    assert res_exif.status_code == 200

    # 5. image-bg-remove
    res_bg = client.post(
        "/api/v1/tools/image-bg-remove",
        files={"file": ("sujeto.png", png_bytes, "image/png")},
    )
    assert res_bg.status_code == 200
    assert res_bg.headers["content-type"] == "image/png"

    # 6. image-ico-favicon
    res_ico = client.post(
        "/api/v1/tools/image-ico-favicon",
        files={"file": ("logo.png", png_bytes, "image/png")},
    )
    assert res_ico.status_code == 200

    # 7. image-palette
    res_pal = client.post(
        "/api/v1/tools/image-palette",
        files={"file": ("arte.png", png_bytes, "image/png")},
    )
    assert res_pal.status_code == 200
    assert res_pal.headers["content-type"] == "image/png"


def test_files_dev_and_ai_local_endpoints(client):
    sample_json = json.dumps([{"nombre": "Ana", "rol": "Ingeniera", "correo": "ana@empresa.com"}]).encode("utf-8")

    # 1. data-transform (JSON -> CSV)
    res_dt = client.post(
        "/api/v1/tools/data-transform",
        files={"file": ("equipo.json", sample_json, "application/json")},
        data={"target_format": "csv"},
    )
    assert res_dt.status_code == 200
    assert "Ingeniera" in res_dt.text

    # 2. file-hash-verify
    res_hash = client.post(
        "/api/v1/tools/file-hash-verify",
        files={"file": ("equipo.json", sample_json, "application/json")},
    )
    assert res_hash.status_code == 200
    assert "SHA-256" in res_hash.text

    # 3. file-vault encrypt & decrypt roundtrip
    res_enc = client.post(
        "/api/v1/tools/file-vault",
        files={"file": ("secreto.json", sample_json, "application/json")},
        data={"password": "ClaveSegura2026", "mode": "encrypt"},
    )
    assert res_enc.status_code == 200
    encrypted_bytes = res_enc.content
    assert encrypted_bytes.startswith(b"TRNVLT01")

    res_dec = client.post(
        "/api/v1/tools/file-vault",
        files={"file": ("secreto.json.tvault", encrypted_bytes, "application/octet-stream")},
        data={"password": "ClaveSegura2026", "mode": "decrypt"},
    )
    assert res_dec.status_code == 200
    assert res_dec.content == sample_json

    # 4. archive-pack
    res_zip = client.post(
        "/api/v1/tools/archive-pack",
        files={"files": ("equipo.json", sample_json, "application/json")},
        data={"mode": "zip"},
    )
    assert res_zip.status_code == 200

    # 5. regex-diff-lab
    res_rx = client.post(
        "/api/v1/tools/regex-diff-lab",
        files={"files": ("equipo.json", sample_json, "text/plain")},
    )
    assert res_rx.status_code == 200
    assert "ana@empresa.com" in res_rx.text

    # 6. qr-barcode-batch
    res_qr = client.post(
        "/api/v1/tools/qr-barcode-batch",
        data={"raw_items": "https://tornio.local\nITEM-001"},
    )
    assert res_qr.status_code == 200

    # 7. ai-doc-summary & ai-doc-chunks
    pdf_bytes = _make_sample_pdf(
        "El contrato de prestación de servicios establece entregas trimestrales verificadas. "
        "Contacto oficial: soporte@empresa.org o telefono +51 999888777."
    )
    res_sum = client.post(
        "/api/v1/tools/ai-doc-summary",
        files={"file": ("contrato.pdf", pdf_bytes, "application/pdf")},
    )
    assert res_sum.status_code == 200
    assert "Resumen Ejecutivo" in res_sum.text

    res_chk = client.post(
        "/api/v1/tools/ai-doc-chunks",
        files={"file": ("contrato.pdf", pdf_bytes, "application/pdf")},
        data={"chunk_size": "300", "overlap": "50"},
    )
    assert res_chk.status_code == 200
    parsed_chunks = json.loads(res_chk.text)
    assert parsed_chunks["total_chunks"] >= 1


def test_pipelines_engine_and_recipes(client):
    # Crear receta personalizada
    res_create = client.post(
        "/api/v1/pipelines/recipes",
        json={
            "title": "Entrega Legal Blindada",
            "description": "Repara, limpia metadatos y comprime PDF",
            "domain": "pdf",
            "steps": ["pdf-repair", "metadata-clean", "compress-pdf"],
        },
    )
    assert res_create.status_code == 200
    recipe_id = res_create.json()["id"]

    # Listar recetas
    res_list = client.get("/api/v1/pipelines/recipes")
    assert res_list.status_code == 200
    assert any(r["id"] == recipe_id for r in res_list.json()["items"])

    # Ejecutar pipeline de 3 pasos sobre un PDF real
    pdf_bytes = _make_sample_pdf("Informe Confidencial de Auditoría 2026")
    res_exec = client.post(
        "/api/v1/pipelines/execute",
        files={"file": ("informe.pdf", pdf_bytes, "application/pdf")},
        data={"steps": "pdf-repair,metadata-clean,watermark-pdf", "watermark_text": "APROBADO"},
    )
    assert res_exec.status_code == 200
    assert res_exec.content.startswith(b"%PDF")
    assert res_exec.headers.get("X-Pipeline-Steps") == "3"

    # Eliminar receta
    res_del = client.delete(f"/api/v1/pipelines/recipes/{recipe_id}")
    assert res_del.status_code == 200
