import fitz
import os
import tempfile
import shutil
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool

class PDFUnlockerService:
    @staticmethod
    def _unlock_sync(input_path: str, password: str, output_path: str) -> str:
        try:
            doc = fitz.open(input_path)
        except Exception as e:
            raise PDFProcessingError(f"Error abriendo PDF: {str(e)}")

        try:
            if not doc.is_encrypted:
                shutil.copyfile(input_path, output_path)
                return output_path
                
            if not doc.authenticate(password):
                raise PDFProcessingError("Contraseña incorrecta")
                
            doc.save(output_path)
        except PDFProcessingError:
            raise
        except Exception as e:
            raise PDFProcessingError(f"Error desbloqueando el PDF: {str(e)}")
        finally:
            doc.close()

        return output_path

    async def unlock_pdf(self, input_path: str, password: str, output_path: str) -> str:
        return await run_in_threadpool(self._unlock_sync, input_path, password, output_path)

def get_pdf_unlocker_service() -> PDFUnlockerService:
    return PDFUnlockerService()
