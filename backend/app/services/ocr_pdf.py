import os
import re
import uuid
import fitz
import pytesseract
from PIL import Image  # noqa: F401 - needed by pytesseract
from fastapi.concurrency import run_in_threadpool
from app.core.exceptions import BusinessRuleError, PDFProcessingError
from app.utils.binaries import find_tesseract, get_effective_tessdata_dir, get_ocr_languages

LANGUAGE_REGEX = re.compile(r"^[a-z_]{3,}(\+[a-z_]{3,})*$")


def validate_ocr_language(language: str) -> str:
    """Valida el formato del codigo de idioma OCR y verifica disponibilidad si es posible."""
    lang = (language or "").strip()
    if not LANGUAGE_REGEX.match(lang):
        raise BusinessRuleError(
            f"Codigo de idioma OCR invalido: '{language}'. "
            "Usa codigos de 3+ letras minusculas como 'spa', 'eng' o 'spa+eng'."
        )

    installed = get_ocr_languages()
    if installed:
        requested = lang.split("+")
        missing = [code for code in requested if code not in installed]
        if missing:
            raise BusinessRuleError(
                f"Idioma(s) OCR no instalado(s) en Tesseract: {', '.join(missing)}. "
                f"Disponibles: {', '.join(installed)}"
            )
    return lang


class OcrService:
    @staticmethod
    def _ocr_sync(input_path: str, output_path: str, language: str = "spa") -> str:
        validated_lang = validate_ocr_language(language)

        tess_path = find_tesseract()
        if not tess_path:
            raise PDFProcessingError(
                "Tesseract no encontrado. Por favor, instala Tesseract-OCR o vincula su ruta "
                "desde el Gestor de Modulos de OpenPDF."
            )

        pytesseract.pytesseract.tesseract_cmd = tess_path
        tessdata_dir = get_effective_tessdata_dir(tess_path)
        tess_config = f'--tessdata-dir "{tessdata_dir}"' if tessdata_dir else ""

        try:
            doc = fitz.open(input_path)
        except Exception as e:
            raise PDFProcessingError(f"Error abriendo PDF para OCR: {str(e)}")

        final_pdf = fitz.open()
        temp_files: list[str] = []
        temp_dir = os.path.dirname(output_path)

        try:
            for page in doc:
                existing_text = page.get_text().strip()

                if existing_text:
                    single_page = fitz.open()
                    try:
                        single_page.insert_pdf(doc, from_page=page.number, to_page=page.number)
                        final_pdf.insert_pdf(single_page)
                    finally:
                        single_page.close()
                else:
                    pix = page.get_pixmap(dpi=300)
                    img_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}.png")
                    temp_files.append(img_path)
                    pix.save(img_path)

                    pdf_bytes = pytesseract.image_to_pdf_or_hocr(
                        img_path,
                        extension="pdf",
                        lang=validated_lang,
                        config=tess_config,
                    )

                    temp_pdf_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}.pdf")
                    temp_files.append(temp_pdf_path)
                    with open(temp_pdf_path, "wb") as f:
                        f.write(pdf_bytes)

                    temp_doc = fitz.open(temp_pdf_path)
                    try:
                        final_pdf.insert_pdf(temp_doc)
                    finally:
                        temp_doc.close()

            final_pdf.save(output_path)
        except (BusinessRuleError, PDFProcessingError):
            raise
        except Exception as e:
            raise PDFProcessingError(f"Error realizando OCR: {str(e)}")
        finally:
            for tf in temp_files:
                try:
                    if os.path.exists(tf):
                        os.remove(tf)
                except Exception:
                    pass
            final_pdf.close()
            doc.close()

        return output_path

    async def ocr_pdf(self, input_path: str, output_path: str, language: str = "spa") -> str:
        return await run_in_threadpool(self._ocr_sync, input_path, output_path, language)


def get_ocr_service() -> OcrService:
    return OcrService()
