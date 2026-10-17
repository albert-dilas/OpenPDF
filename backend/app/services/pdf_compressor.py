import fitz
from fastapi.concurrency import run_in_threadpool
from app.core.exceptions import BusinessRuleError, PDFProcessingError
from app.core.logging import logger

VALID_COMPRESSION_LEVELS = {"low", "medium", "high"}


class PDFCompressorService:
    @staticmethod
    def _compress_sync(input_path: str, output_path: str, level: str = "medium") -> str:
        normalized_level = (level or "medium").strip().lower()
        if normalized_level not in VALID_COMPRESSION_LEVELS:
            raise BusinessRuleError(
                f"Nivel de compresión inválido: '{level}'. Valores permitidos: low, medium, high."
            )

        try:
            doc = fitz.open(input_path)
        except Exception as e:
            raise PDFProcessingError(f"Error abriendo PDF: {str(e)}")

        try:
            if normalized_level == "low":
                doc.save(output_path, garbage=3, deflate=True)
            elif normalized_level == "medium":
                doc.save(
                    output_path,
                    garbage=4,
                    deflate=True,
                    clean=True,
                    deflate_images=True,
                    deflate_fonts=True,
                )
            elif normalized_level == "high":
                if hasattr(doc, "rewrite_images"):
                    try:
                        doc.rewrite_images(dpi_threshold=150, dpi_target=110, quality=60)
                    except Exception as img_err:
                        logger.warning("Fallback en rewrite_images durante compresión high: %s", img_err)
                doc.save(
                    output_path,
                    garbage=4,
                    deflate=True,
                    clean=True,
                    deflate_images=True,
                    deflate_fonts=True,
                )
        except (PDFProcessingError, BusinessRuleError):
            raise
        except Exception as e:
            raise PDFProcessingError(f"Error comprimiendo PDF: {str(e)}")
        finally:
            doc.close()

        return output_path

    async def compress_pdf(self, input_path: str, output_path: str, level: str = "medium") -> str:
        return await run_in_threadpool(self._compress_sync, input_path, output_path, level)


def get_pdf_compressor_service() -> PDFCompressorService:
    return PDFCompressorService()
