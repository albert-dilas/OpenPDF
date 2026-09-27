import fitz  # PyMuPDF
from typing import List
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool

class PDFMergerService:
    @staticmethod
    def _merge_sync(input_paths: List[str], output_path: str) -> str:
        result_pdf = fitz.open()
        
        for path in input_paths:
            try:
                pdf_doc = fitz.open(path)
                result_pdf.insert_pdf(pdf_doc)
                pdf_doc.close()
            except Exception as e:
                result_pdf.close()
                raise PDFProcessingError(f"Error procesando {path}: {str(e)}")
                
        try:
            result_pdf.save(output_path)
        except Exception as e:
            raise PDFProcessingError(f"Error al guardar el archivo de salida: {str(e)}")
        finally:
            result_pdf.close()
        
        return output_path

    async def merge_pdfs(self, input_paths: List[str], output_path: str) -> str:
        """
        Une una lista de archivos PDF de manera asíncrona usando un threadpool
        para evitar bloquear el Event Loop principal.
        """
        return await run_in_threadpool(self._merge_sync, input_paths, output_path)

def get_pdf_merger_service() -> PDFMergerService:
    return PDFMergerService()

