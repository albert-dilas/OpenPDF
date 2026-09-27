import fitz
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool

class PDFWatermarkService:
    @staticmethod
    def _watermark_sync(input_path: str, text: str, output_path: str) -> str:
        try:
            doc = fitz.open(input_path)
        except Exception as e:
            raise PDFProcessingError(f"Error abriendo PDF: {str(e)}")

        try:
            for page in doc:
                rect = page.rect
                # Posición diagonal en el centro
                point = fitz.Point(rect.width / 4, rect.height / 2)
                page.insert_text(point, text, fontsize=50, color=(1, 0, 0), rotate=45, fill_opacity=0.3)
                
            doc.save(output_path)
        except Exception as e:
            raise PDFProcessingError(f"Error procesando la marca de agua: {str(e)}")
        finally:
            doc.close()

        return output_path

    async def add_watermark_pdf(self, input_path: str, text: str, output_path: str) -> str:
        return await run_in_threadpool(self._watermark_sync, input_path, text, output_path)

def get_pdf_watermark_service() -> PDFWatermarkService:
    return PDFWatermarkService()
