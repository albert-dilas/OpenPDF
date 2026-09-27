import fitz
from typing import List
from app.utils.file_manager import create_temp_output_path

def convert_jpg_to_pdf(input_paths: List[str]) -> str:
    output_path = create_temp_output_path()
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
    return output_path
