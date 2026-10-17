import fitz
from typing import List
from app.core.exceptions import BusinessRuleError, PDFProcessingError
from fastapi.concurrency import run_in_threadpool


class JpgToPdfService:
    @staticmethod
    def _convert_sync(input_paths: List[str], output_path: str) -> str:
        if not input_paths:
            raise BusinessRuleError("Debes proporcionar al menos una imagen para convertir a PDF.")

        doc = fitz.open()
        try:
            for img_path in input_paths:
                img_doc = fitz.open(img_path)
                try:
                    pdf_bytes = img_doc.convert_to_pdf()
                finally:
                    img_doc.close()

                pdf_doc = fitz.open("pdf", pdf_bytes)
                try:
                    doc.insert_pdf(pdf_doc)
                finally:
                    pdf_doc.close()

            doc.save(output_path)
        except (BusinessRuleError, PDFProcessingError):
            raise
        except Exception as e:
            raise PDFProcessingError(f"Error convirtiendo JPG a PDF: {str(e)}")
        finally:
            doc.close()

        return output_path

    async def convert_jpg_to_pdf(self, input_paths: List[str], output_path: str) -> str:
        return await run_in_threadpool(self._convert_sync, input_paths, output_path)


def get_jpg_to_pdf_service() -> JpgToPdfService:
    return JpgToPdfService()
