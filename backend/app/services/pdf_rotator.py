import fitz
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool

class PDFRotatorService:
    @staticmethod
    def _rotate_sync(input_path: str, output_path: str, degrees: int) -> str:
        try:
            doc = fitz.open(input_path)
            for page in doc:
                page.set_rotation(page.rotation + degrees)
            doc.save(output_path)
            doc.close()
            return output_path
        except Exception as e:
            raise PDFProcessingError(f"Error al rotar PDF: {str(e)}")

    async def rotate_pdf(self, input_path: str, output_path: str, degrees: int = 90) -> str:
        return await run_in_threadpool(self._rotate_sync, input_path, output_path, degrees)

def get_pdf_rotator_service() -> PDFRotatorService:
    return PDFRotatorService()
