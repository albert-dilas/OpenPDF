import fitz
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool

class PageNumbersService:
    @staticmethod
    def _add_page_numbers_sync(input_path: str, output_path: str) -> str:
        try:
            doc = fitz.open(input_path)
            for i, page in enumerate(doc):
                rect = page.rect
                # Centro inferior
                point = fitz.Point(rect.width / 2, rect.height - 30)
                text = str(i + 1)
                page.insert_text(point, text, fontsize=12, color=(0, 0, 0))
                
            doc.save(output_path)
            doc.close()
        except Exception as e:
            raise PDFProcessingError(f"Error añadiendo números de página: {str(e)}")
        return output_path

    async def add_page_numbers_pdf(self, input_path: str, output_path: str) -> str:
        return await run_in_threadpool(self._add_page_numbers_sync, input_path, output_path)

def get_page_numbers_service() -> PageNumbersService:
    return PageNumbersService()
