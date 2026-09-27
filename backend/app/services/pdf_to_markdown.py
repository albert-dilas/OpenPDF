import pymupdf4llm
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool

class PDFToMarkdownService:
    @staticmethod
    def _convert_sync(input_path: str, output_path: str) -> str:
        try:
            md_text = pymupdf4llm.to_markdown(input_path)
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(md_text)
            return output_path
        except Exception as e:
            raise PDFProcessingError(f"Error al convertir PDF a Markdown: {str(e)}")

    async def convert_pdf_to_markdown(self, input_path: str, output_path: str) -> str:
        return await run_in_threadpool(self._convert_sync, input_path, output_path)

def get_pdf_to_markdown_service() -> PDFToMarkdownService:
    return PDFToMarkdownService()
