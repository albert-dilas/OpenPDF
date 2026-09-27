import fitz
from app.utils.file_manager import create_temp_output_path

def protect_pdf(input_path: str, password: str) -> str:
    output_path = create_temp_output_path()
    doc = fitz.open(input_path)
    doc.save(output_path, user_pw=password, owner_pw=password, encryption=fitz.PDF_ENCRYPT_AES_256)
    doc.close()
    return output_path
