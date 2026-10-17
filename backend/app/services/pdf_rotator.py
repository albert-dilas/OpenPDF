import fitz
from app.core.exceptions import BusinessRuleError, PDFProcessingError
from fastapi.concurrency import run_in_threadpool


class PDFRotatorService:
    @staticmethod
    def _rotate_sync(input_path: str, output_path: str, degrees: int) -> str:
        if isinstance(degrees, bool) or not isinstance(degrees, int) or degrees % 90 != 0:
            raise BusinessRuleError("Los grados de rotación deben ser múltiplos de 90 (ej. 90, 180, 270).")

        try:
            doc = fitz.open(input_path)
        except Exception as e:
            raise PDFProcessingError(f"Error al rotar PDF: {str(e)}")

        try:
            for page in doc:
                page.set_rotation((page.rotation + degrees) % 360)
            doc.save(output_path)
            return output_path
        except Exception as e:
            raise PDFProcessingError(f"Error al rotar PDF: {str(e)}")
        finally:
            doc.close()

    async def rotate_pdf(self, input_path: str, output_path: str, degrees: int = 90) -> str:
        return await run_in_threadpool(self._rotate_sync, input_path, output_path, degrees)


def get_pdf_rotator_service() -> PDFRotatorService:
    return PDFRotatorService()
