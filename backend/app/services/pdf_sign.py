"""Servicio 100% local para estampar firmas manuscritas o sellos de imagen en documentos PDF."""
from typing import List, Optional, Set
import fitz
from PIL import Image
from fastapi.concurrency import run_in_threadpool

from app.core.exceptions import BusinessRuleError, PDFProcessingError

VALID_POSITIONS = {
    "bottom-right",
    "bottom-left",
    "bottom-center",
    "top-right",
    "top-left",
    "center",
}


def resolve_target_pages(pages_spec: str, total_pages: int) -> List[int]:
    """Convierte 'all', 'first', 'last' o '1,3-5' en índices 0-based."""
    if total_pages <= 0:
        raise BusinessRuleError("El documento PDF no contiene páginas.")

    spec = (pages_spec or "last").strip().lower()
    if spec == "all":
        return list(range(total_pages))
    if spec == "first":
        return [0]
    if spec == "last":
        return [total_pages - 1]

    selected: Set[int] = set()
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            bounds = part.split("-", 1)
            if len(bounds) != 2 or not bounds[0].strip().isdigit() or not bounds[1].strip().isdigit():
                raise BusinessRuleError(f"Rango de páginas inválido: '{part}'.")
            start, end = int(bounds[0].strip()), int(bounds[1].strip())
            if start < 1 or end < start or end > total_pages:
                raise BusinessRuleError(
                    f"El rango '{part}' está fuera de los límites del documento (1-{total_pages})."
                )
            for p in range(start - 1, end):
                selected.add(p)
        else:
            if not part.isdigit():
                raise BusinessRuleError(f"Número de página inválido: '{part}'.")
            page_num = int(part)
            if page_num < 1 or page_num > total_pages:
                raise BusinessRuleError(
                    f"La página {page_num} está fuera de los límites del documento (1-{total_pages})."
                )
            selected.add(page_num - 1)

    if not selected:
        raise BusinessRuleError("Debes seleccionar al menos una página para aplicar la firma.")

    return sorted(selected)


def compute_box_rect(
    page_rect: fitz.Rect,
    img_width: int,
    img_height: int,
    position: str,
    scale: float,
    margin: float = 36.0,
    reserve_bottom_label: bool = False,
) -> fitz.Rect:
    """Calcula el rectángulo destino manteniendo proporción de la imagen de firma/sello."""
    clamped_scale = max(0.08, min(0.55, float(scale)))
    box_w = page_rect.width * clamped_scale
    aspect = (img_height / img_width) if img_width > 0 else 0.45
    box_h = min(page_rect.height * 0.35, max(24.0, box_w * aspect))

    extra_bottom = 16.0 if reserve_bottom_label else 0.0

    if position == "bottom-left":
        x0 = page_rect.x0 + margin
        y0 = page_rect.y1 - margin - box_h - extra_bottom
    elif position == "bottom-center":
        x0 = page_rect.x0 + (page_rect.width - box_w) / 2.0
        y0 = page_rect.y1 - margin - box_h - extra_bottom
    elif position == "top-right":
        x0 = page_rect.x1 - margin - box_w
        y0 = page_rect.y0 + margin
    elif position == "top-left":
        x0 = page_rect.x0 + margin
        y0 = page_rect.y0 + margin
    elif position == "center":
        x0 = page_rect.x0 + (page_rect.width - box_w) / 2.0
        y0 = page_rect.y0 + (page_rect.height - box_h) / 2.0
    else:  # bottom-right por defecto
        x0 = page_rect.x1 - margin - box_w
        y0 = page_rect.y1 - margin - box_h - extra_bottom

    return fitz.Rect(x0, y0, x0 + box_w, y0 + box_h)


class PDFSignService:
    @staticmethod
    def _sign_pdf_sync(
        input_path: str,
        signature_path: str,
        output_path: str,
        pages: str = "last",
        position: str = "bottom-right",
        scale: float = 0.22,
        label_text: Optional[str] = None,
    ) -> str:
        pos = (position or "bottom-right").strip().lower()
        if pos not in VALID_POSITIONS:
            raise BusinessRuleError(f"Posición '{position}' no válida.")

        try:
            with Image.open(signature_path) as im:
                img_w, img_h = im.size
        except Exception as exc:
            raise BusinessRuleError(f"La imagen de firma o sello no es válida: {str(exc)}")

        try:
            doc = fitz.open(input_path)
        except Exception as exc:
            raise PDFProcessingError(f"Error abriendo el documento PDF: {str(exc)}")

        try:
            if doc.is_encrypted:
                raise BusinessRuleError("No se puede firmar un PDF protegido con contraseña.")

            target_indices = resolve_target_pages(pages, len(doc))
            clean_label = (label_text or "").strip()[:80]

            for page_idx in target_indices:
                page = doc[page_idx]
                target_rect = compute_box_rect(
                    page.rect,
                    img_w,
                    img_h,
                    pos,
                    scale,
                    reserve_bottom_label=bool(clean_label),
                )
                page.insert_image(
                    target_rect,
                    filename=signature_path,
                    keep_proportion=True,
                    overlay=True,
                )

                if clean_label:
                    label_rect = fitz.Rect(
                        target_rect.x0 - 10,
                        target_rect.y1 + 2,
                        target_rect.x1 + 10,
                        target_rect.y1 + 18,
                    )
                    page.insert_textbox(
                        label_rect,
                        clean_label,
                        fontsize=7.5,
                        fontname="helv",
                        color=(0.22, 0.25, 0.32),
                        align=fitz.TEXT_ALIGN_CENTER,
                        overlay=True,
                    )

            doc.save(output_path, garbage=2, deflate=True)
            return output_path
        except (BusinessRuleError, PDFProcessingError):
            raise
        except Exception as exc:
            raise PDFProcessingError(f"Error aplicando la firma al PDF: {str(exc)}")
        finally:
            doc.close()

    async def sign_pdf(
        self,
        input_path: str,
        signature_path: str,
        output_path: str,
        pages: str = "last",
        position: str = "bottom-right",
        scale: float = 0.22,
        label_text: Optional[str] = None,
    ) -> str:
        return await run_in_threadpool(
            self._sign_pdf_sync,
            input_path,
            signature_path,
            output_path,
            pages,
            position,
            scale,
            label_text,
        )


def get_pdf_sign_service() -> PDFSignService:
    return PDFSignService()
