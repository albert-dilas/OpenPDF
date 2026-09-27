import fitz
import math
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
                if not text:
                    continue
                rect = page.rect
                # Usamos insert_textbox con una matriz de rotación de 45° para el efecto diagonal.
                # insert_text solo acepta rotate en múltiplos de 90; insert_textbox acepta una matrix
                # arbitraria que combinamos con traslación al centro de la página.
                center_x = rect.width / 2
                center_y = rect.height / 2
                # Rectángulo grande centrado en la página
                text_rect = fitz.Rect(
                    center_x - 250, center_y - 50,
                    center_x + 250, center_y + 50
                )
                # Matriz: rotar 45° alrededor del origen, luego trasladar al centro
                angle_rad = math.radians(45)
                cos_a = math.cos(angle_rad)
                sin_a = math.sin(angle_rad)
                # fitz.Matrix(a, b, c, d, e, f) → [[a,b],[c,d]] + translation [e,f]
                matrix = fitz.Matrix(cos_a, sin_a, -sin_a, cos_a, 0, 0)
                page.insert_textbox(
                    text_rect,
                    text,
                    fontsize=50,
                    color=(1, 0, 0),
                    fill_opacity=0.3,
                    morph=(fitz.Point(center_x, center_y), matrix),
                    align=fitz.TEXT_ALIGN_CENTER,
                )

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
