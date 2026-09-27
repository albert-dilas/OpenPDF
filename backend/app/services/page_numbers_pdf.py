import fitz
from app.utils.file_manager import create_temp_output_path

def add_page_numbers_pdf(input_path: str) -> str:
    output_path = create_temp_output_path()
    doc = fitz.open(input_path)
    
    for i, page in enumerate(doc):
        rect = page.rect
        # Centro inferior
        point = fitz.Point(rect.width / 2, rect.height - 30)
        text = str(i + 1)
        page.insert_text(point, text, fontsize=12, color=(0, 0, 0))
        
    doc.save(output_path)
    doc.close()
    return output_path
