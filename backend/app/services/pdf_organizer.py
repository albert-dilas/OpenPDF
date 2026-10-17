import json
from typing import Any, Dict, List
import fitz
from fastapi.concurrency import run_in_threadpool
from app.core.exceptions import BusinessRuleError, PDFProcessingError


def parse_pages_spec(pages_json: str) -> List[Dict[str, int]]:
    """Valida y normaliza la especificación JSON de páginas [{index, rotation}]."""
    if not pages_json or not pages_json.strip():
        raise BusinessRuleError("El parámetro 'pages' no puede estar vacío.")

    try:
        parsed: Any = json.loads(pages_json)
    except Exception:
        raise BusinessRuleError("El parámetro 'pages' debe ser un JSON válido.")

    if not isinstance(parsed, list) or len(parsed) == 0:
        raise BusinessRuleError("La lista 'pages' debe ser un arreglo JSON no vacío.")

    normalized: List[Dict[str, int]] = []
    for item in parsed:
        if not isinstance(item, dict) or "index" not in item:
            raise BusinessRuleError("Cada elemento de 'pages' debe ser un objeto con el campo 'index'.")

        idx = item["index"]
        rot = item.get("rotation", 0)

        if isinstance(idx, bool) or not isinstance(idx, int):
            raise BusinessRuleError(f"El índice de página '{idx}' debe ser un número entero.")
        if isinstance(rot, bool) or not isinstance(rot, int):
            raise BusinessRuleError(f"La rotación '{rot}' debe ser un número entero.")
        if rot % 90 != 0:
            raise BusinessRuleError(f"La rotación ({rot}) debe ser múltiplo de 90 grados (0, 90, 180, 270).")

        normalized.append({"index": idx, "rotation": rot % 360})

    return normalized


class PDFOrganizerService:
    @staticmethod
    def _organize_sync(input_path: str, output_path: str, pages_json: str) -> str:
        spec = parse_pages_spec(pages_json)

        try:
            src_doc = fitz.open(input_path)
        except Exception as e:
            raise PDFProcessingError(f"Error abriendo PDF: {str(e)}")

        out_doc = fitz.open()
        try:
            if src_doc.is_encrypted:
                raise BusinessRuleError("No se puede organizar un PDF protegido con contraseña.")

            total_pages = len(src_doc)
            for item in spec:
                idx = item["index"]
                if idx < 0 or idx >= total_pages:
                    raise BusinessRuleError(
                        f"El índice de página {idx} está fuera de rango (0-{max(total_pages - 1, 0)})."
                    )

            for item in spec:
                idx = item["index"]
                added_rotation = item["rotation"]
                out_doc.insert_pdf(src_doc, from_page=idx, to_page=idx)
                new_page = out_doc[-1]
                current_rotation = int(new_page.rotation or 0)
                new_page.set_rotation((current_rotation + added_rotation) % 360)

            out_doc.save(output_path)
            return output_path
        except (BusinessRuleError, PDFProcessingError):
            raise
        except Exception as e:
            raise PDFProcessingError(f"Error organizando PDF: {str(e)}")
        finally:
            out_doc.close()
            src_doc.close()

    async def organize_pdf(self, input_path: str, output_path: str, pages_json: str) -> str:
        return await run_in_threadpool(self._organize_sync, input_path, output_path, pages_json)


def get_pdf_organizer_service() -> PDFOrganizerService:
    return PDFOrganizerService()
