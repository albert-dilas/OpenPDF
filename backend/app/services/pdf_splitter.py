import fitz
import zipfile
import os
import tempfile
from typing import List, Optional
from app.core.exceptions import PDFProcessingError, BusinessRuleError
from fastapi.concurrency import run_in_threadpool


def parse_page_ranges(ranges_str: str, total_pages: int) -> List[int]:
    """
    Parsea un string de rangos de páginas en lista de índices 0-based.

    Formato aceptado (1-based): "1,3-5,7" → [0, 2, 3, 4, 6]

    Args:
        ranges_str: String de rangos separados por coma. Ej: "1,3-5,7"
        total_pages: Total de páginas del documento.

    Returns:
        Lista de índices de página (0-based), deduplicados y ordenados.

    Raises:
        BusinessRuleError: Si el formato es inválido o los números están fuera de rango.
    """
    pages: List[int] = []

    for part in ranges_str.split(","):
        part = part.strip()
        if not part:
            continue

        if "-" in part:
            bounds = part.split("-", 1)
            if len(bounds) != 2:
                raise BusinessRuleError(f"Rango inválido: '{part}'")
            try:
                start = int(bounds[0].strip())
                end = int(bounds[1].strip())
            except ValueError:
                raise BusinessRuleError(f"Rango inválido: '{part}' — deben ser números enteros.")

            if start < 1 or end < 1:
                raise BusinessRuleError(f"Los números de página deben ser mayores a 0.")
            if start > end:
                raise BusinessRuleError(f"En el rango '{part}', el inicio debe ser menor o igual al fin.")
            if end > total_pages:
                raise BusinessRuleError(
                    f"La página {end} no existe. El documento tiene {total_pages} página(s)."
                )

            pages.extend(range(start - 1, end))  # convertir a 0-based
        else:
            try:
                page_num = int(part)
            except ValueError:
                raise BusinessRuleError(f"Número de página inválido: '{part}'")

            if page_num < 1 or page_num > total_pages:
                raise BusinessRuleError(
                    f"La página {page_num} no existe. El documento tiene {total_pages} página(s)."
                )

            pages.append(page_num - 1)  # convertir a 0-based

    # Deduplicar y ordenar
    return sorted(set(pages))


class PDFSplitterService:
    @staticmethod
    def _split_sync(input_path: str, output_path: str, page_ranges: Optional[str] = None) -> str:
        try:
            doc = fitz.open(input_path)
        except Exception as e:
            raise PDFProcessingError(f"Error abriendo PDF: {str(e)}")

        total_pages = len(doc)

        # Determinar qué páginas extraer
        if page_ranges and page_ranges.strip():
            page_indices = parse_page_ranges(page_ranges, total_pages)
        else:
            page_indices = list(range(total_pages))  # todas las páginas

        if not page_indices:
            doc.close()
            raise BusinessRuleError("No se seleccionaron páginas para extraer.")

        try:
            with zipfile.ZipFile(output_path, 'w', compression=zipfile.ZIP_DEFLATED) as zipf:
                for i in page_indices:
                    doc2 = fitz.open()
                    doc2.insert_pdf(doc, from_page=i, to_page=i)

                    fd, page_path = tempfile.mkstemp(suffix=f"_page_{i + 1}.pdf")
                    os.close(fd)

                    try:
                        doc2.save(page_path)
                        doc2.close()
                        zipf.write(page_path, f"page_{i + 1}.pdf")
                    finally:
                        if os.path.exists(page_path):
                            os.remove(page_path)

        except (PDFProcessingError, BusinessRuleError):
            raise
        except Exception as e:
            raise PDFProcessingError(f"Error dividiendo PDF: {str(e)}")
        finally:
            doc.close()

        return output_path

    async def split_pdf_to_zip(
        self,
        input_path: str,
        output_path: str,
        page_ranges: Optional[str] = None,
    ) -> str:
        return await run_in_threadpool(self._split_sync, input_path, output_path, page_ranges)


def get_pdf_splitter_service() -> PDFSplitterService:
    return PDFSplitterService()
