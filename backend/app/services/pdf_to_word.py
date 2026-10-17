from pdf2docx import Converter
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool


class PDFToWordService:
    @staticmethod
    def _convert_sync(input_path: str, output_path: str) -> str:
        cv = None
        try:
            cv = Converter(input_path)
            cv.convert(output_path, start=0, end=None)
            return output_path
        except Exception as e:
            raise PDFProcessingError(f"Error al convertir PDF a Word: {str(e)}")
        finally:
            if cv is not None:
                try:
                    cv.close()
                except Exception:
                    pass

    async def convert_pdf_to_word(self, input_path: str, output_path: str) -> str:
        return await run_in_threadpool(self._convert_sync, input_path, output_path)


def get_pdf_to_word_service() -> PDFToWordService:
    return PDFToWordService()
