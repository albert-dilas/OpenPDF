import os
import subprocess
import shutil
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool

class WordToPDFService:
    @staticmethod
    def _convert_sync(input_path: str, output_path: str) -> str:
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
            raise PDFProcessingError("LibreOffice no encontrado. Por favor, instala LibreOffice en C:\\Program Files\\LibreOffice o colócalo en backend/bin/LibreOfficePortable para el instalador.")

        outdir = os.path.dirname(input_path)
        
        try:
            subprocess.run([
                soffice_path,
                "--headless",
                "--convert-to",
                "pdf",
                input_path,
                "--outdir",
                outdir
            ], check=True)
            
            base_name = os.path.splitext(os.path.basename(input_path))[0]
            expected_output = os.path.join(outdir, f"{base_name}.pdf")
            
            if os.path.exists(expected_output):
                shutil.move(expected_output, output_path)
                return output_path
            else:
                raise PDFProcessingError("Error al convertir Word a PDF con LibreOffice: No se generó el archivo esperado.")
        except subprocess.CalledProcessError as e:
            raise PDFProcessingError(f"Error ejecutando LibreOffice: {str(e)}")
        except Exception as e:
            raise PDFProcessingError(f"Error inesperado al convertir Word a PDF: {str(e)}")

    async def convert_word_to_pdf(self, input_path: str, output_path: str) -> str:
        return await run_in_threadpool(self._convert_sync, input_path, output_path)

def get_word_to_pdf_service() -> WordToPDFService:
    return WordToPDFService()
