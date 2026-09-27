import fitz
import zipfile
import os
import tempfile
from typing import List
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool

class PDFSplitterService:
    @staticmethod
    def _split_sync(input_path: str, output_path: str) -> str:
        try:
            doc = fitz.open(input_path)
        except Exception as e:
            raise PDFProcessingError(f"Error abriendo PDF: {str(e)}")

        try:
            with zipfile.ZipFile(output_path, 'w') as zipf:
                for i in range(len(doc)):
                    doc2 = fitz.open()
                    doc2.insert_pdf(doc, from_page=i, to_page=i)
                    
                    fd, page_path = tempfile.mkstemp(suffix=f"_page_{i+1}.pdf")
                    os.close(fd)
                    
                    try:
                        doc2.save(page_path)
                        doc2.close()
                        zipf.write(page_path, f"page_{i+1}.pdf")
                    finally:
                        if os.path.exists(page_path):
                            os.remove(page_path)
        except Exception as e:
            raise PDFProcessingError(f"Error dividiendo PDF: {str(e)}")
        finally:
            doc.close()

        return output_path

    async def split_pdf_to_zip(self, input_path: str, output_path: str) -> str:
        return await run_in_threadpool(self._split_sync, input_path, output_path)

def get_pdf_splitter_service() -> PDFSplitterService:
    return PDFSplitterService()
