import fitz
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool

class PDFCompressorService:
    @staticmethod
    def _compress_sync(input_path: str, output_path: str) -> str:
        try:
            doc = fitz.open(input_path)
            doc.save(output_path, deflate=True, garbage=4, clean=True)
            doc.close()
        except Exception as e:
            raise PDFProcessingError(f"Error comprimiendo PDF: {str(e)}")
        return output_path

    async def compress_pdf(self, input_path: str, output_path: str) -> str:
        return await run_in_threadpool(self._compress_sync, input_path, output_path)

def get_pdf_compressor_service() -> PDFCompressorService:
    return PDFCompressorService()
