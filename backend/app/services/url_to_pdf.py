"""Servicio para capturar páginas web públicas o importar PDFs remotos desde una URL con protección SSRF."""
import html as html_stdlib
import re
from datetime import datetime, timezone
from typing import List, Tuple
import fitz
import httpx
from fastapi.concurrency import run_in_threadpool
from lxml import html as lxml_html

from app.core.config import settings
from app.core.exceptions import BusinessRuleError, PDFProcessingError
from app.utils.network import validate_public_http_url
from app.utils.validators import validate_pdf_bytes

MAX_REMOTE_BYTES = 20 * 1024 * 1024  # 20 MB límite para descarga web

PAGE_SIZES = {
    "a4": (595.0, 842.0),
    "letter": (612.0, 792.0),
}


def _extract_structured_html_blocks(raw_html: str, url: str, mode: str = "reader") -> Tuple[str, str]:
    """
    Extrae bloques semánticos limpios desde el HTML remoto y genera un documento HTML
    optimizado para el motor tipográfico `fitz.Story` de PyMuPDF.
    """
    try:
        tree = lxml_html.fromstring(raw_html)
    except Exception as exc:
        raise PDFProcessingError(f"No se pudo analizar el contenido HTML de la URL: {str(exc)}")

    title_nodes = tree.xpath("//title/text()")
    page_title = re.sub(r"\s+", " ", title_nodes[0]).strip() if title_nodes else url

    # Eliminar nodos no imprimibles o de ruido
    remove_tags = ["script", "style", "noscript", "iframe", "svg", "canvas", "form", "button"]
    if mode == "reader":
        remove_tags.extend(["nav", "footer", "aside", "header"])

    for tag in remove_tags:
        for elem in tree.xpath(f"//{tag}"):
            parent = elem.getparent()
            if parent is not None:
                parent.remove(elem)

    root_node = tree
    if mode == "reader":
        candidates = tree.xpath("//article | //main | //*[@role='main']")
        if candidates:
            # Elegir el contenedor con mayor cantidad de texto
            root_node = max(candidates, key=lambda el: len(el.text_content() or ""))

    blocks: List[str] = []
    seen_texts = set()

    target_Tags = ("h1", "h2", "h3", "h4", "p", "li", "blockquote", "pre", "tr")
    for elem in root_node.iter():
        if not isinstance(elem.tag, str):
            continue
        tag = elem.tag.lower()
        if tag not in target_Tags:
            continue

        text = re.sub(r"\s+", " ", (elem.text_content() or "")).strip()
        if not text or len(text) < 2:
            continue

        # Evitar duplicar texto exacto consecutivo o de contenedores anidados
        sig = f"{tag}:{text[:160]}"
        if sig in seen_texts:
            continue
        seen_texts.add(sig)

        escaped = html_stdlib.escape(text)
        if tag == "h1":
            blocks.append(f"<h2>{escaped}</h2>")
        elif tag in ("h2", "h3", "h4"):
            blocks.append(f"<h3>{escaped}</h3>")
        elif tag == "li":
            blocks.append(f"<p>• {escaped}</p>")
        elif tag == "blockquote":
            blocks.append(f"<blockquote>{escaped}</blockquote>")
        elif tag == "pre":
            blocks.append(f"<pre>{escaped}</pre>")
        elif tag == "tr":
            cells = [
                re.sub(r"\s+", " ", (c.text_content() or "")).strip()
                for c in elem.xpath("./th | ./td")
            ]
            cells = [html_stdlib.escape(c) for c in cells if c]
            if cells:
                blocks.append(f"<p><b>|</b> {' <b>|</b> '.join(cells)} <b>|</b></p>")
        else:
            blocks.append(f"<p>{escaped}</p>")

    if not blocks:
        fallback_text = re.sub(r"\s+", " ", (tree.text_content() or "")).strip()
        if not fallback_text:
            raise BusinessRuleError("La página web no contiene texto legible para exportar a PDF.")
        for chunk in re.split(r"(?<=[.!?])\s+", fallback_text):
            if chunk.strip():
                blocks.append(f"<p>{html_stdlib.escape(chunk.strip())}</p>")

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    safe_title = html_stdlib.escape(page_title[:160])
    safe_url = html_stdlib.escape(url)

    story_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <style>
            body {{
                font-family: sans-serif;
                font-size: 10.5pt;
                line-height: 1.5;
                color: #111827;
            }}
            .meta-box {{
                border-bottom: 1px solid #d1d5db;
                padding-bottom: 8pt;
                margin-bottom: 14pt;
            }}
            h1 {{
                font-size: 17pt;
                color: #111827;
                margin-top: 0;
                margin-bottom: 4pt;
            }}
            .source-url {{
                font-size: 8.5pt;
                color: #4b5563;
                margin-bottom: 2pt;
            }}
            h2 {{
                font-size: 13.5pt;
                color: #1f2937;
                margin-top: 12pt;
                margin-bottom: 5pt;
            }}
            h3 {{
                font-size: 11.5pt;
                color: #374151;
                margin-top: 10pt;
                margin-bottom: 4pt;
            }}
            p {{
                margin-top: 0;
                margin-bottom: 7pt;
                text-align: justify;
            }}
            blockquote {{
                margin-left: 14pt;
                color: #374151;
                font-style: italic;
                margin-bottom: 8pt;
            }}
            pre {{
                font-family: monospace;
                font-size: 8.5pt;
                background-color: #f3f4f6;
                padding: 6pt;
                margin-bottom: 8pt;
            }}
        </style>
    </head>
    <body>
        <div class="meta-box">
            <h1>{safe_title}</h1>
            <p class="source-url">Fuente: {safe_url}</p>
            <p class="source-url">Capturado con OpenPDF v{settings.VERSION} ({timestamp})</p>
        </div>
        {"".join(blocks)}
    </body>
    </html>
    """
    return story_html, page_title


def render_html_story_to_pdf(story_html: str, output_path: str, page_size: str = "a4", title: str = "") -> str:
    """Renderiza HTML estructurado a un PDF multipágina vectorial mediante `fitz.Story`."""
    width, height = PAGE_SIZES.get((page_size or "a4").lower(), PAGE_SIZES["a4"])
    mediabox = fitz.Rect(0, 0, width, height)
    margin = 48.0
    where = fitz.Rect(margin, margin, width - margin, height - margin)

    try:
        story = fitz.Story(html=story_html)
        writer = fitz.DocumentWriter(output_path)
        more = 1
        while more:
            device = writer.begin_page(mediabox)
            more, _ = story.place(where)
            story.draw(device)
            writer.end_page()
        writer.close()

        if title:
            doc = fitz.open(output_path)
            try:
                doc.set_metadata({"title": title[:140], "producer": f"OpenPDF v{settings.VERSION}"})
                doc.saveIncr()
            finally:
                doc.close()

        return output_path
    except Exception as exc:
        raise PDFProcessingError(f"Error renderizando el documento PDF: {str(exc)}")


class URLToPDFService:
    async def convert_url_to_pdf(
        self,
        url: str,
        output_path: str,
        mode: str = "reader",
        page_size: str = "a4",
    ) -> str:
        validated_url = validate_public_http_url(url)
        clean_mode = (mode or "reader").strip().lower()
        if clean_mode not in ("reader", "full"):
            raise BusinessRuleError("El modo de captura debe ser 'reader' o 'full'.")

        clean_size = (page_size or "a4").strip().lower()
        if clean_size not in PAGE_SIZES:
            raise BusinessRuleError("El tamaño de página debe ser 'a4' o 'letter'.")

        headers = {
            "User-Agent": f"OpenPDF/{settings.VERSION} (+https://github.com/albert-dilas/OpenPDF)",
            "Accept": "text/html,application/xhtml+xml,application/pdf,text/plain;q=0.9,*/*;q=0.8",
        }

        try:
            async with httpx.AsyncClient(timeout=12.0, follow_redirects=True, max_redirects=5) as client:
                response = await client.get(validated_url, headers=headers)
        except httpx.TimeoutException:
            raise BusinessRuleError("Tiempo de espera agotado al descargar la página web.")
        except httpx.HTTPError as exc:
            raise BusinessRuleError(f"Error de red al consultar la URL: {str(exc)}")

        final_url = str(response.url)
        validate_public_http_url(final_url)

        if response.status_code >= 400:
            raise BusinessRuleError(
                f"El servidor remoto devolvió un error HTTP {response.status_code} al acceder a la URL."
            )

        raw_bytes = response.content
        if len(raw_bytes) > MAX_REMOTE_BYTES:
            raise BusinessRuleError("El recurso remoto supera el límite permitido de 20 MB.")

        content_type = response.headers.get("content-type", "").lower()
        if "application/pdf" in content_type or validate_pdf_bytes(raw_bytes):
            if not validate_pdf_bytes(raw_bytes):
                raise BusinessRuleError("El archivo remoto indica ser PDF pero su cabecera no es válida.")
            with open(output_path, "wb") as f:
                f.write(raw_bytes)
            return output_path

        try:
            decoded_html = raw_bytes.decode(response.encoding or "utf-8", errors="replace")
        except Exception:
            decoded_html = raw_bytes.decode("utf-8", errors="replace")

        def _build_sync() -> str:
            story_html, page_title = _extract_structured_html_blocks(decoded_html, final_url, clean_mode)
            return render_html_story_to_pdf(story_html, output_path, clean_size, title=page_title)

        return await run_in_threadpool(_build_sync)


def get_url_to_pdf_service() -> URLToPDFService:
    return URLToPDFService()
