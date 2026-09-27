import fitz
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool

class PDFProtectorService:
    @staticmethod
    def _protect_sync(input_path: str, output_path: str, password: str) -> str:
        try:
            doc = fitz.open(input_path)
            doc.save(output_path, user_pw=password, owner_pw=password, encryption=fitz.PDF_ENCRYPT_AES_256)
            doc.close()
            return output_path
        except Exception as e:
            raise PDFProcessingError(f"Error al proteger PDF: {str(e)}")

    async def protect_pdf(self, input_path: str, output_path: str, password: str) -> str:
        return await run_in_threadpool(self._protect_sync, input_path, output_path, password)

def get_pdf_protector_service() -> PDFProtectorService:
    return PDFProtectorService()
