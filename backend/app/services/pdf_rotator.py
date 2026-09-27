import fitz
from app.utils.file_manager import create_temp_output_path

def rotate_pdf(input_path: str, degrees: int = 90) -> str:
    output_path = create_temp_output_path()
    doc = fitz.open(input_path)
    for page in doc:
        page.set_rotation(page.rotation + degrees)
    doc.save(output_path)
    doc.close()
    return output_path
