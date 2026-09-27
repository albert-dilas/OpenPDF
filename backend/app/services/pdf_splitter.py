import fitz
import zipfile
import os
from app.utils.file_manager import create_temp_output_path

def split_pdf_to_zip(input_path: str) -> str:
    doc = fitz.open(input_path)
    zip_output_path = create_temp_output_path(".zip")
    with zipfile.ZipFile(zip_output_path, 'w') as zipf:
        for i in range(len(doc)):
            doc2 = fitz.open()
            doc2.insert_pdf(doc, from_page=i, to_page=i)
            page_path = create_temp_output_path(f"_page_{i+1}.pdf")
            doc2.save(page_path)
            doc2.close()
            zipf.write(page_path, f"page_{i+1}.pdf")
            os.remove(page_path)
    doc.close()
    return zip_output_path
