import fitz
import zipfile
import os
from app.utils.file_manager import create_temp_output_path

def convert_pdf_to_jpg(input_path: str) -> str:
    doc = fitz.open(input_path)
    zip_output_path = create_temp_output_path(".zip")
    
    with zipfile.ZipFile(zip_output_path, 'w') as zipf:
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=150)
            jpg_path = create_temp_output_path(f"_page_{i+1}.jpg")
            pix.save(jpg_path)
            zipf.write(jpg_path, f"page_{i+1}.jpg")
            os.remove(jpg_path)
            
    doc.close()
    return zip_output_path
