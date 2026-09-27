import os
import subprocess
import shutil
from typing import Optional
from app.core.exceptions import PDFProcessingError
from fastapi.concurrency import run_in_threadpool


def _find_soffice() -> Optional[str]:
    """
    Detecta la ruta de LibreOffice en múltiples plataformas.
    Prioridad: PATH del sistema (Linux/macOS/Windows con PATH configurado)
    → bundle portátil → rutas de instalación estándar de Windows.
    """
    # 1. Buscar en PATH del sistema (Linux, macOS, Windows con PATH configurado)
    system_path = shutil.which("soffice") or shutil.which("libreoffice")
    if system_path:
        return system_path

    # 2. Bundle portátil (para el instalador Windows de OpenPDF)
    portable = os.path.join(
        os.getcwd(), "bin", "LibreOfficePortable",
        "App", "libreoffice", "program", "soffice.exe"
    )
    if os.path.exists(portable):
        return portable

    # 3. Rutas de instalación estándar de Windows
    windows_paths = [
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    ]
    for path in windows_paths:
        if os.path.exists(path):
            return path

    return None


class WordToPDFService:
    CONVERSION_TIMEOUT_SECONDS = 120  # 2 minutos máximo

    @staticmethod
    def _convert_sync(input_path: str, output_path: str) -> str:
        soffice_path = _find_soffice()

        if not soffice_path:
            raise PDFProcessingError(
                "LibreOffice no encontrado. Instala LibreOffice desde https://www.libreoffice.org/ "
                "o colócalo en backend/bin/LibreOfficePortable para la versión instalador."
            )

        outdir = os.path.dirname(input_path)

        try:
            subprocess.run(
                [soffice_path, "--headless", "--convert-to", "pdf", input_path, "--outdir", outdir],
                check=True,
                timeout=WordToPDFService.CONVERSION_TIMEOUT_SECONDS,
                capture_output=True,  # Suprime output de LibreOffice en consola
            )
        except subprocess.TimeoutExpired:
            raise PDFProcessingError(
                f"LibreOffice tardó más de {WordToPDFService.CONVERSION_TIMEOUT_SECONDS}s. "
                "El archivo puede estar dañado o ser demasiado complejo."
            )
        except subprocess.CalledProcessError as e:
            raise PDFProcessingError(f"LibreOffice terminó con error: {e.returncode}")

        base_name = os.path.splitext(os.path.basename(input_path))[0]
        expected_output = os.path.join(outdir, f"{base_name}.pdf")

        if not os.path.exists(expected_output):
            raise PDFProcessingError(
                "LibreOffice no generó el archivo de salida esperado. "
                "El documento Word puede estar corrupto."
            )

        shutil.move(expected_output, output_path)
        return output_path

    async def convert_word_to_pdf(self, input_path: str, output_path: str) -> str:
        return await run_in_threadpool(self._convert_sync, input_path, output_path)


def get_word_to_pdf_service() -> WordToPDFService:
    return WordToPDFService()
