import fitz
import zipfile
import os
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool

class PDFToJpgService:
    @staticmethod
    def _convert_sync(input_path: str, output_path: str) -> str:
        try:
            doc = fitz.open(input_path)
            with zipfile.ZipFile(output_path, 'w') as zipf:
                for i, page in enumerate(doc):
                    pix = page.get_pixmap(dpi=150)
                    jpg_path = f"{output_path}_page_{i+1}.jpg"
                    pix.save(jpg_path)
                    zipf.write(jpg_path, f"page_{i+1}.jpg")
                    os.remove(jpg_path)
            doc.close()
            return output_path
        except Exception as e:
            raise PDFProcessingError(f"Error al convertir PDF a JPG: {str(e)}")

    async def convert_pdf_to_jpg(self, input_path: str, output_path: str) -> str:
        return await run_in_threadpool(self._convert_sync, input_path, output_path)

def get_pdf_to_jpg_service() -> PDFToJpgService:
    return PDFToJpgService()
