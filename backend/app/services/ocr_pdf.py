import os
import fitz
import pytesseract
from PIL import Image  # noqa: F401 - needed by pytesseract
import uuid
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool

class OcrService:
    @staticmethod
    def _ocr_sync(input_path: str, output_path: str, language: str = 'spa') -> str:
        # Buscar Tesseract
        possible_paths = [
            os.path.join(os.getcwd(), "bin", "Tesseract-OCR", "tesseract.exe"),
            "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
            "C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe"
        ]
        
        tess_path = None
        for path in possible_paths:
            if os.path.exists(path):
                tess_path = path
                break
                
        if not tess_path:
            raise PDFProcessingError("Tesseract no encontrado. Por favor, instala Tesseract-OCR en C:\\Program Files\\Tesseract-OCR o colócalo en backend/bin/Tesseract-OCR.")
            
        pytesseract.pytesseract.tesseract_cmd = tess_path
        
        doc = fitz.open(input_path)
        final_pdf = fitz.open()
        temp_files: list[str] = []
        
        # We need a temp directory or just use the same dir as output_path for temp files
        temp_dir = os.path.dirname(output_path)
        
        try:
            for page in doc:
                existing_text = page.get_text().strip()

                if existing_text:
                    # Página con texto existente: copiar directamente sin OCR
                    single_page = fitz.open()
                    single_page.insert_pdf(doc, from_page=page.number, to_page=page.number)
                    final_pdf.insert_pdf(single_page)
                    single_page.close()
                else:
                    # Página escaneada (sin texto): aplicar OCR
                    pix = page.get_pixmap(dpi=300)
                    img_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}.png")
                    temp_files.append(img_path)
                    pix.save(img_path)

                    pdf_bytes = pytesseract.image_to_pdf_or_hocr(img_path, extension='pdf', lang=language)

                    temp_pdf_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}.pdf")
                    temp_files.append(temp_pdf_path)
                    with open(temp_pdf_path, "wb") as f:
                        f.write(pdf_bytes)

                    temp_doc = fitz.open(temp_pdf_path)
                    final_pdf.insert_pdf(temp_doc)
                    temp_doc.close()
                
            final_pdf.save(output_path)
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

    async def ocr_pdf(self, input_path: str, output_path: str, language: str = 'spa') -> str:
        return await run_in_threadpool(self._ocr_sync, input_path, output_path, language)

def get_ocr_service() -> OcrService:
    return OcrService()
