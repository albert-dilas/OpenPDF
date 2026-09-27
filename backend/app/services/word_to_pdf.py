import os
import subprocess
from app.utils.file_manager import create_temp_output_path

def convert_word_to_pdf(input_path: str) -> str:
    # Buscar LibreOffice
    possible_paths = [
        os.path.join(os.getcwd(), "bin", "LibreOfficePortable", "App", "libreoffice", "program", "soffice.exe"),
        "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
        "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"
    ]
    
    soffice_path = None
    for path in possible_paths:
        if os.path.exists(path):
            soffice_path = path
            break
            
    if not soffice_path:
        raise Exception("LibreOffice no encontrado. Por favor, instala LibreOffice en C:\\Program Files\\LibreOffice o colócalo en backend/bin/LibreOfficePortable para el instalador.")

    # LibreOffice outputs to a directory, not a specific file name. It uses the same name but with .pdf
    # So we output it to the temp directory where the input is
    outdir = os.path.dirname(input_path)
    
    subprocess.run([
        soffice_path,
        "--headless",
        "--convert-to",
        "pdf",
        input_path,
        "--outdir",
        outdir
    ], check=True)
    
    # El archivo resultante se llamará igual que el input pero con .pdf
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    expected_output = os.path.join(outdir, f"{base_name}.pdf")
    
    if os.path.exists(expected_output):
        return expected_output
    else:
        raise Exception("Error al convertir Word a PDF con LibreOffice.")
