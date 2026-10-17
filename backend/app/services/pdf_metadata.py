from typing import Optional
import fitz
from fastapi.concurrency import run_in_threadpool
from app.core.exceptions import BusinessRuleError, PDFProcessingError


class PDFMetadataService:
    @staticmethod
    def _update_metadata_sync(
        input_path: str,
        output_path: str,
        title: Optional[str] = None,
        author: Optional[str] = None,
        subject: Optional[str] = None,
        keywords: Optional[str] = None,
    ) -> str:
        try:
            doc = fitz.open(input_path)
        except Exception as e:
            raise PDFProcessingError(f"Error abriendo PDF: {str(e)}")

        try:
            if doc.is_encrypted:
                raise BusinessRuleError("No se pueden editar los metadatos de un PDF protegido con contraseña.")

            meta = dict(doc.metadata or {})
            if title is not None:
                meta["title"] = title
            if author is not None:
                meta["author"] = author
            if subject is not None:
                meta["subject"] = subject
            if keywords is not None:
                meta["keywords"] = keywords

            # Limpiar /Info y XMP previo para que strings vacíos ("") efectivamente borren el campo en MuPDF
            doc.set_metadata({})
            doc.set_metadata(meta)
            doc.save(output_path)
            return output_path
        except (BusinessRuleError, PDFProcessingError):
            raise
        except Exception as e:
            raise PDFProcessingError(f"Error actualizando metadatos del PDF: {str(e)}")
        finally:
            doc.close()

    async def update_metadata(
        self,
        input_path: str,
        output_path: str,
        title: Optional[str] = None,
        author: Optional[str] = None,
        subject: Optional[str] = None,
        keywords: Optional[str] = None,
    ) -> str:
        return await run_in_threadpool(
            self._update_metadata_sync,
            input_path,
            output_path,
            title,
            author,
            subject,
            keywords,
        )


def get_pdf_metadata_service() -> PDFMetadataService:
    return PDFMetadataService()
