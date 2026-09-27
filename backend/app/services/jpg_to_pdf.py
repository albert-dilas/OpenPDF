import fitz
from typing import List
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool

class JpgToPdfService:
    @staticmethod
    def _convert_sync(input_paths: List[str], output_path: str) -> str:
        try:
            doc = fitz.open()
            for img_path in input_paths:
                img_doc = fitz.open(img_path)
                pdf_bytes = img_doc.convert_to_pdf()
                pdf_doc = fitz.open("pdf", pdf_bytes)
                doc.insert_pdf(pdf_doc)
                img_doc.close()
                pdf_doc.close()
            doc.save(output_path)
            doc.close()
        except Exception as e:
            raise PDFProcessingError(f"Error convirtiendo JPG a PDF: {str(e)}")
        return output_path

    async def convert_jpg_to_pdf(self, input_paths: List[str], output_path: str) -> str:
        return await run_in_threadpool(self._convert_sync, input_paths, output_path)

def get_jpg_to_pdf_service() -> JpgToPdfService:
    return JpgToPdfService()
