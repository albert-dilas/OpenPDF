import fitz  # PyMuPDF
from typing import List
from app.utils.file_manager import create_temp_output_path

def merge_pdfs(input_paths: List[str]) -> str:
    """
    Une una lista de archivos PDF en el orden dado.
    Retorna la ruta del PDF resultante.
    """
    output_path = create_temp_output_path()
    
    result_pdf = fitz.open()
    
    for path in input_paths:
        try:
            pdf_doc = fitz.open(path)
            result_pdf.insert_pdf(pdf_doc)
            pdf_doc.close()
        except Exception as e:
            result_pdf.close()
            raise Exception(f"Error procesando {path}: {str(e)}")
            
    result_pdf.save(output_path)
    result_pdf.close()
    
    return output_path
