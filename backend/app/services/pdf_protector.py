import fitz
from app.core.exceptions import BusinessRuleError, PDFProcessingError
from fastapi.concurrency import run_in_threadpool


class PDFProtectorService:
    @staticmethod
    def _protect_sync(input_path: str, output_path: str, password: str) -> str:
        if not password or not password.strip():
            raise BusinessRuleError("La contraseña no puede estar vacía.")

        try:
            doc = fitz.open(input_path)
        except Exception as e:
            raise PDFProcessingError(f"Error al proteger PDF: {str(e)}")

        try:
            doc.save(
                output_path,
                user_pw=password,
                owner_pw=password,
                encryption=fitz.PDF_ENCRYPT_AES_256,
            )
            return output_path
        except Exception as e:
            raise PDFProcessingError(f"Error al proteger PDF: {str(e)}")
        finally:
            doc.close()

    async def protect_pdf(self, input_path: str, output_path: str, password: str) -> str:
        return await run_in_threadpool(self._protect_sync, input_path, output_path, password)


def get_pdf_protector_service() -> PDFProtectorService:
    return PDFProtectorService()
