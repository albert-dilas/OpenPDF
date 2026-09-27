import pymupdf4llm
from app.utils.file_manager import create_temp_output_path

def convert_pdf_to_markdown(input_path: str) -> str:
    output_path = create_temp_output_path(".md")
    
    md_text = pymupdf4llm.to_markdown(input_path)
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(md_text)
        
    return output_path
