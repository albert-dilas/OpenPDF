"""Servicio 100% local para censurar y purgar datos sensibles de forma irreversible en archivos PDF."""
import re
from typing import List, Optional, Tuple
import fitz
from fastapi.concurrency import run_in_threadpool

from app.core.exceptions import BusinessRuleError, PDFProcessingError

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
URL_REGEX = re.compile(r"(?:https?://|www\.)[^\s<>\"']+", re.IGNORECASE)
PHONE_REGEX = re.compile(
    r"(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}"
)
ID_CARD_REGEX = re.compile(r"\b(?:\d{8,19}|(?:\d{4}[-\s]){3}\d{4})\b")


def _parse_search_terms(raw_terms: Optional[str]) -> List[str]:
    if not raw_terms:
        return []
    parts = re.split(r"[\n,;]+", raw_terms)
    cleaned = [p.strip() for p in parts if p and p.strip()]
    return list(dict.fromkeys(cleaned))


class PDFRedactService:
    @staticmethod
    def _redact_pdf_sync(
        input_path: str,
        output_path: str,
        terms: Optional[str] = None,
        redact_emails: bool = False,
        redact_phones: bool = False,
        redact_ids: bool = False,
        redact_urls: bool = False,
        fill_color: str = "black",
    ) -> Tuple[str, int]:
        parsed_terms = _parse_search_terms(terms)
        if not parsed_terms and not any([redact_emails, redact_phones, redact_ids, redact_urls]):
            raise BusinessRuleError(
                "Debes indicar al menos un término de búsqueda o activar un patrón automático de censura."
            )

        fill_rgb = (1.0, 1.0, 1.0) if (fill_color or "").strip().lower() == "white" else (0.0, 0.0, 0.0)

        active_regexes: List[re.Pattern] = []
        if redact_emails:
            active_regexes.append(EMAIL_REGEX)
        if redact_urls:
            active_regexes.append(URL_REGEX)
        if redact_phones:
            active_regexes.append(PHONE_REGEX)
        if redact_ids:
            active_regexes.append(ID_CARD_REGEX)

        try:
            doc = fitz.open(input_path)
        except Exception as exc:
            raise PDFProcessingError(f"Error abriendo el documento PDF: {str(exc)}")

        total_redactions = 0
        try:
            if doc.is_encrypted:
                raise BusinessRuleError("No se puede censurar un PDF protegido con contraseña.")

            for page in doc:
                page_rects: List[fitz.Rect] = []

                # 1. Búsqueda directa de términos o frases personalizadas
                for term in parsed_terms:
                    rects = page.search_for(term)
                    for r in rects:
                        page_rects.append(r)

                # 2. Evaluación de patrones regex sobre el texto de la página y localización de áreas
                if active_regexes:
                    full_text = page.get_text("text") or ""
                    matched_strings = set()
                    for pattern in active_regexes:
                        for match in pattern.finditer(full_text):
                            candidate = match.group(0).strip()
                            if pattern is PHONE_REGEX:
                                digits_only = re.sub(r"\D", "", candidate)
                                if len(digits_only) < 7:
                                    continue
                            if len(candidate) >= 3:
                                matched_strings.add(candidate)

                    for matched in matched_strings:
                        for r in page.search_for(matched):
                            page_rects.append(r)

                if page_rects:
                    for rect in page_rects:
                        page.add_redact_annot(rect, fill=fill_rgb)
                        total_redactions += 1
                    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_PIXELS)

            doc.save(output_path, garbage=3, deflate=True)
            return output_path, total_redactions
        except (BusinessRuleError, PDFProcessingError):
            raise
        except Exception as exc:
            raise PDFProcessingError(f"Error aplicando censura permanente al PDF: {str(exc)}")
        finally:
            doc.close()

    async def redact_pdf(
        self,
        input_path: str,
        output_path: str,
        terms: Optional[str] = None,
        redact_emails: bool = False,
        redact_phones: bool = False,
        redact_ids: bool = False,
        redact_urls: bool = False,
        fill_color: str = "black",
    ) -> Tuple[str, int]:
        return await run_in_threadpool(
            self._redact_pdf_sync,
            input_path,
            output_path,
            terms,
            redact_emails,
            redact_phones,
            redact_ids,
            redact_urls,
            fill_color,
        )


def get_pdf_redact_service() -> PDFRedactService:
    return PDFRedactService()
