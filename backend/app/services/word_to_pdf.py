import os
import subprocess
import shutil
from fastapi.concurrency import run_in_threadpool
from app.core.exceptions import PDFProcessingError
from app.utils.binaries import find_soffice


class WordToPDFService:
    CONVERSION_TIMEOUT_SECONDS = 120  # 2 minutos máximo

    @staticmethod
    def _convert_sync(input_path: str, output_path: str) -> str:
        soffice_path = find_soffice()

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
