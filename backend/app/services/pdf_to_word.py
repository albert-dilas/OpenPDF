from pdf2docx import Converter
from app.utils.file_manager import create_temp_output_path

def convert_pdf_to_word(input_path: str) -> str:
    output_path = create_temp_output_path(".docx")
    cv = Converter(input_path)
    cv.convert(output_path, start=0, end=None)
    cv.close()
    return output_path
