import os
import subprocess
import shutil
from fastapi.concurrency import run_in_threadpool
from app.core.exceptions import PDFProcessingError
from app.utils.binaries import find_soffice, find_msword, find_word_converter


class WordToPDFService:
    CONVERSION_TIMEOUT_SECONDS = 120  # 2 minutos maximo

    @staticmethod
    def _convert_with_libreoffice(soffice_path: str, input_path: str, output_path: str) -> str:
        outdir = os.path.dirname(input_path)

        try:
            subprocess.run(
                [soffice_path, "--headless", "--convert-to", "pdf", input_path, "--outdir", outdir],
                check=True,
                timeout=WordToPDFService.CONVERSION_TIMEOUT_SECONDS,
                capture_output=True,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
        except subprocess.TimeoutExpired:
            raise PDFProcessingError(
                f"LibreOffice tardo mas de {WordToPDFService.CONVERSION_TIMEOUT_SECONDS}s. "
                "El archivo puede estar danado o ser demasiado complejo."
            )
        except subprocess.CalledProcessError as e:
            raise PDFProcessingError(f"LibreOffice termino con error: {e.returncode}")

        base_name = os.path.splitext(os.path.basename(input_path))[0]
        expected_output = os.path.join(outdir, f"{base_name}.pdf")

        if not os.path.exists(expected_output):
            raise PDFProcessingError(
                "LibreOffice no genero el archivo de salida esperado. "
                "El documento Word puede estar corrupto."
            )

        shutil.move(expected_output, output_path)
        return output_path

    @staticmethod
    def _convert_with_msword(input_path: str, output_path: str) -> str:
        abs_in = os.path.abspath(input_path)
        abs_out = os.path.abspath(output_path)

        ps_script = (
            "$ErrorActionPreference = 'Stop'; "
            "$inPath = $env:OPENPDF_WORD_IN; "
            "$outPath = $env:OPENPDF_WORD_OUT; "
            "$word = $null; $doc = $null; "
            "try { "
            "  $word = New-Object -ComObject Word.Application; "
            "  $word.Visible = $false; "
            "  $word.DisplayAlerts = 0; "
            "  $doc = $word.Documents.Open($inPath, $false, $true); "
            "  $doc.ExportAsFixedFormat($outPath, 17); "
            "  $doc.Close($false); "
            "  $doc = $null; "
            "} finally { "
            "  if ($doc -ne $null) { try { $doc.Close($false) } catch {} } "
            "  if ($word -ne $null) { try { $word.Quit() } catch {} } "
            "}"
        )

        env = os.environ.copy()
        env["OPENPDF_WORD_IN"] = abs_in
        env["OPENPDF_WORD_OUT"] = abs_out

        try:
            subprocess.run(
                ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
                check=True,
                timeout=WordToPDFService.CONVERSION_TIMEOUT_SECONDS,
                capture_output=True,
                env=env,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
        except subprocess.TimeoutExpired:
            raise PDFProcessingError(
                f"Microsoft Word tardo mas de {WordToPDFService.CONVERSION_TIMEOUT_SECONDS}s en exportar el PDF."
            )
        except subprocess.CalledProcessError as e:
            stderr_msg = (e.stderr.decode("utf-8", errors="ignore") if e.stderr else "").strip()
            raise PDFProcessingError(
                f"Microsoft Word no pudo convertir el documento a PDF. {stderr_msg}".strip()
            )

        if not os.path.exists(abs_out):
            raise PDFProcessingError(
                "Microsoft Word no genero el archivo PDF esperado. El documento puede estar corrupto."
            )

        return output_path

    @staticmethod
    def _convert_sync(input_path: str, output_path: str) -> str:
        converter_bin, engine_type, _ = find_word_converter()

        if engine_type == "libreoffice" and converter_bin:
            return WordToPDFService._convert_with_libreoffice(converter_bin, input_path, output_path)

        if engine_type == "msword" and converter_bin:
            return WordToPDFService._convert_with_msword(input_path, output_path)

        soffice_path = find_soffice()
        if soffice_path:
            return WordToPDFService._convert_with_libreoffice(soffice_path, input_path, output_path)

        msword_path = find_msword()
        if msword_path:
            return WordToPDFService._convert_with_msword(input_path, output_path)

        raise PDFProcessingError(
            "No se detecto LibreOffice ni Microsoft Word en el sistema. "
            "Puedes instalar LibreOffice con 1 clic o vincular el ejecutable desde el Gestor de Modulos."
        )

    async def convert_word_to_pdf(self, input_path: str, output_path: str) -> str:
        return await run_in_threadpool(self._convert_sync, input_path, output_path)


def get_word_to_pdf_service() -> WordToPDFService:
    return WordToPDFService()
