"""Servicio para traducir el contenido de documentos PDF en línea y maquetar el PDF traducido."""
import html as html_stdlib
import re
from typing import Dict, List, Tuple
import fitz
import httpx
from fastapi.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.exceptions import BusinessRuleError, PDFProcessingError
from app.services.url_to_pdf import render_html_story_to_pdf

SUPPORTED_LANGUAGES: Dict[str, str] = {
    "auto": "Detectar idioma",
    "es": "Español",
    "en": "Inglés",
    "pt": "Portugués",
    "fr": "Francés",
    "de": "Alemán",
    "it": "Italiano",
}

MAX_TRANSLATE_PAGES = 40
MAX_CHUNK_CHARS = 1500


def _chunk_paragraphs(paragraphs: List[str], max_chars: int = MAX_CHUNK_CHARS) -> List[str]:
    chunks: List[str] = []
    current: List[str] = []
    current_len = 0

    for p in paragraphs:
        clean = re.sub(r"\s+", " ", p).strip()
        if not clean:
            continue
        if len(clean) > max_chars:
            if current:
                chunks.append("\n\n".join(current))
                current = []
                current_len = 0
            for i in range(0, len(clean), max_chars):
                chunks.append(clean[i : i + max_chars])
            continue

        if current_len + len(clean) + 2 > max_chars and current:
            chunks.append("\n\n".join(current))
            current = [clean]
            current_len = len(clean)
        else:
            current.append(clean)
            current_len += len(clean) + 2

    if current:
        chunks.append("\n\n".join(current))

    return chunks


async def translate_text_chunk(
    client: httpx.AsyncClient,
    text: str,
    source_lang: str,
    target_lang: str,
) -> str:
    """
    Traduce un fragmento de texto usando el endpoint público de Google Translate GTX
    con fallback automático a MyMemory API.
    """
    if not text.strip():
        return ""

    # 1. Intento vía Google Translate GTX
    try:
        params = {
            "client": "gtx",
            "sl": source_lang,
            "tl": target_lang,
            "dt": "t",
            "q": text,
        }
        res = await client.get(
            "https://translate.googleapis.com/translate_a/single",
            params=params,
            timeout=8.0,
        )
        if res.status_code == 200:
            payload = res.json()
            if isinstance(payload, list) and len(payload) > 0 and isinstance(payload[0], list):
                translated_parts = [
                    str(seg[0]) for seg in payload[0] if isinstance(seg, list) and len(seg) > 0 and seg[0]
                ]
                joined = "".join(translated_parts).strip()
                if joined:
                    return joined
    except Exception:
        pass

    # 2. Fallback vía MyMemory API
    try:
        sl = "en" if source_lang == "auto" else source_lang
        res = await client.get(
            "https://api.mymemory.translated.net/get",
            params={"q": text[:500], "langpair": f"{sl}|{target_lang}"},
            timeout=8.0,
        )
        if res.status_code == 200:
            data = res.json()
            translated = str(data.get("responseData", {}).get("translatedText") or "").strip()
            if translated:
                return translated
    except Exception:
        pass

    raise BusinessRuleError(
        "No se pudo conectar con el servicio de traducción en línea. Verifica tu conexión a Internet."
    )


class PDFTranslateService:
    @staticmethod
    def _extract_pages_paragraphs(input_path: str) -> List[Tuple[int, List[str]]]:
        try:
            doc = fitz.open(input_path)
        except Exception as exc:
            raise PDFProcessingError(f"Error abriendo el documento PDF: {str(exc)}")

        try:
            if doc.is_encrypted:
                raise BusinessRuleError("No se puede traducir un PDF protegido con contraseña.")
            if len(doc) == 0:
                raise BusinessRuleError("El documento PDF está vacío.")

            pages_data: List[Tuple[int, List[str]]] = []
            max_pages = min(len(doc), MAX_TRANSLATE_PAGES)
            for idx in range(max_pages):
                page = doc[idx]
                blocks = page.get_text("blocks") or []
                paragraphs: List[str] = []
                for b in blocks:
                    # b = (x0, y0, x1, y1, text, block_no, block_type)
                    if len(b) >= 7 and b[6] == 0:
                        txt = re.sub(r"\s+", " ", str(b[4] or "")).strip()
                        if txt:
                            paragraphs.append(txt)
                if paragraphs:
                    pages_data.append((idx + 1, paragraphs))

            if not pages_data:
                raise BusinessRuleError(
                    "El PDF no contiene texto seleccionable. Ejecuta primero la herramienta 'OCR PDF'."
                )
            return pages_data
        finally:
            doc.close()

    async def translate_pdf(
        self,
        input_path: str,
        output_path: str,
        source_lang: str = "auto",
        target_lang: str = "es",
        mode: str = "translated",
    ) -> Tuple[str, int]:
        src = (source_lang or "auto").strip().lower()
        tgt = (target_lang or "es").strip().lower()
        clean_mode = (mode or "translated").strip().lower()

        if src not in SUPPORTED_LANGUAGES:
            raise BusinessRuleError(f"Idioma de origen '{source_lang}' no soportado.")
        if tgt not in SUPPORTED_LANGUAGES or tgt == "auto":
            raise BusinessRuleError(f"Idioma de destino '{target_lang}' no válido.")
        if src == tgt:
            raise BusinessRuleError("El idioma de origen y el idioma de destino deben ser distintos.")
        if clean_mode not in ("translated", "bilingual"):
            raise BusinessRuleError("El modo de traducción debe ser 'translated' o 'bilingual'.")

        pages_data = await run_in_threadpool(self._extract_pages_paragraphs, input_path)

        headers = {"User-Agent": f"OpenPDF/{settings.VERSION}"}
        html_sections: List[str] = []

        async with httpx.AsyncClient(headers=headers) as client:
            for page_num, paragraphs in pages_data:
                chunks = _chunk_paragraphs(paragraphs)
                page_items_html: List[str] = [f"<h2>Página {page_num}</h2>"]

                for chunk in chunks:
                    translated_chunk = await translate_text_chunk(client, chunk, src, tgt)
                    orig_parts = [p.strip() for p in chunk.split("\n\n") if p.strip()]
                    trans_parts = [p.strip() for p in translated_chunk.split("\n\n") if p.strip()]

                    if clean_mode == "bilingual":
                        for orig_p in orig_parts:
                            page_items_html.append(
                                f"<p class='orig'>{html_stdlib.escape(orig_p)}</p>"
                            )
                        for trans_p in trans_parts:
                            page_items_html.append(
                                f"<p class='trans'>{html_stdlib.escape(trans_p)}</p>"
                            )
                    else:
                        for trans_p in trans_parts:
                            page_items_html.append(f"<p>{html_stdlib.escape(trans_p)}</p>")

                html_sections.append("".join(page_items_html))

        target_label = SUPPORTED_LANGUAGES[tgt]
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
                .header {{
                    border-bottom: 1px solid #d1d5db;
                    padding-bottom: 6pt;
                    margin-bottom: 12pt;
                }}
                h1 {{
                    font-size: 15pt;
                    margin: 0 0 3pt 0;
                    color: #111827;
                }}
                .sub {{
                    font-size: 8.5pt;
                    color: #4b5563;
                    margin: 0;
                }}
                h2 {{
                    font-size: 12pt;
                    color: #991b1b;
                    margin-top: 12pt;
                    margin-bottom: 6pt;
                }}
                p {{
                    margin-top: 0;
                    margin-bottom: 7pt;
                    text-align: justify;
                }}
                p.orig {{
                    font-size: 9.2pt;
                    color: #4b5563;
                    font-style: italic;
                    margin-bottom: 3pt;
                }}
                p.trans {{
                    font-size: 10.5pt;
                    color: #111827;
                    margin-bottom: 9pt;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Documento Traducido ({html_stdlib.escape(target_label)})</h1>
                <p class="sub">Generado con OpenPDF v{settings.VERSION} · Modo: {"Bilingüe" if clean_mode == "bilingual" else "Traducción directa"}</p>
            </div>
            {"".join(html_sections)}
        </body>
        </html>
        """

        await run_in_threadpool(
            render_html_story_to_pdf,
            story_html,
            output_path,
            "a4",
            f"Traducción ({target_label})",
        )
        return output_path, len(pages_data)


def get_pdf_translate_service() -> PDFTranslateService:
    return PDFTranslateService()
