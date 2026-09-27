import fitz
from app.utils.file_manager import create_temp_output_path

def compress_pdf(input_path: str) -> str:
    output_path = create_temp_output_path()
    doc = fitz.open(input_path)
    doc.save(output_path, deflate=True, garbage=4, clean=True)
    doc.close()
    return output_path
