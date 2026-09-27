import os
import fitz
import pytesseract
from PIL import Image  # noqa: F401 - needed by pytesseract
from app.utils.file_manager import create_temp_output_path


def ocr_pdf(input_path: str, language: str = 'spa') -> str:
    # Buscar Tesseract
    possible_paths = [
        os.path.join(os.getcwd(), "bin", "Tesseract-OCR", "tesseract.exe"),
        "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
        "C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe"
    ]
    
    tess_path = None
    for path in possible_paths:
        if os.path.exists(path):
            tess_path = path
            break
            
    if not tess_path:
        raise Exception("Tesseract no encontrado. Por favor, instala Tesseract-OCR en C:\\Program Files\\Tesseract-OCR o colócalo en backend/bin/Tesseract-OCR.")
        
    pytesseract.pytesseract.tesseract_cmd = tess_path
    
    output_path = create_temp_output_path()
    doc = fitz.open(input_path)
    final_pdf = fitz.open()
    temp_files: list[str] = []
    
    try:
        for page in doc:
            pix = page.get_pixmap(dpi=300)
            img_path = create_temp_output_path(".png")
            temp_files.append(img_path)
            pix.save(img_path)
            
            pdf_bytes = pytesseract.image_to_pdf_or_hocr(img_path, extension='pdf', lang=language)
            
            temp_pdf_path = create_temp_output_path(".pdf")
            temp_files.append(temp_pdf_path)
            with open(temp_pdf_path, "wb") as f:
                f.write(pdf_bytes)
                
            temp_doc = fitz.open(temp_pdf_path)
            final_pdf.insert_pdf(temp_doc)
            temp_doc.close()
            
        final_pdf.save(output_path)
    finally:
        # Limpiar todos los archivos temporales aunque haya excepción
        for tf in temp_files:
            try:
                if os.path.exists(tf):
                    os.remove(tf)
            except Exception:
                pass
        final_pdf.close()
        doc.close()
    
    return output_path
