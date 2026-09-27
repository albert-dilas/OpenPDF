import fitz
from app.utils.file_manager import create_temp_output_path

def unlock_pdf(input_path: str, password: str) -> str:
    output_path = create_temp_output_path()
    doc = fitz.open(input_path)
    
    if not doc.is_encrypted:
        doc.close()
        return input_path # Ya estaba desbloqueado
        
    if not doc.authenticate(password):
        doc.close()
        raise Exception("Contraseña incorrecta")
        
    # Al guardar sin especificar encriptación, se guarda sin contraseña
    doc.save(output_path)
    doc.close()
    return output_path
