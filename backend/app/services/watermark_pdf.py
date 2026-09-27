import fitz
from app.utils.file_manager import create_temp_output_path

def add_watermark_pdf(input_path: str, text: str) -> str:
    output_path = create_temp_output_path()
    doc = fitz.open(input_path)
    
    for page in doc:
        rect = page.rect
        # Posición diagonal en el centro
        point = fitz.Point(rect.width / 4, rect.height / 2)
        page.insert_text(point, text, fontsize=50, color=(1, 0, 0), rotate=45, fill_opacity=0.3)
        
    doc.save(output_path)
    doc.close()
    return output_path
