"""Servicio para generar/estampar códigos QR con verificación online e inspeccionar QRs en PDF."""
import io
import re
from typing import Any, Dict, List, Optional, Tuple
import cv2
import fitz
import numpy as np
import qrcode
from fastapi.concurrency import run_in_threadpool

from app.core.exceptions import BusinessRuleError, PDFProcessingError
from app.services.pdf_sign import compute_box_rect, resolve_target_pages
from app.utils.network import check_url_reachability

MAX_QR_INSPECT_PAGES = 40


def _looks_like_url(payload: str) -> bool:
    text = payload.strip()
    if re.match(r"^https?://", text, flags=re.IGNORECASE):
        return True
    if re.match(r"^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(/.*)?$", text) and " " not in text:
        return True
    return False


def generate_qr_png_bytes(payload: str) -> bytes:
    """Genera una imagen PNG en memoria con el código QR del texto o URL indicado."""
    clean = (payload or "").strip()
    if not clean:
        raise BusinessRuleError("El contenido del código QR no puede estar vacío.")
    if len(clean) > 1200:
        raise BusinessRuleError("El contenido del código QR supera el límite de 1200 caracteres.")

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(clean)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class PDFQRService:
    @staticmethod
    def _stamp_qr_sync(
        input_path: str,
        output_path: str,
        qr_png_bytes: bytes,
        pages: str = "first",
        position: str = "bottom-right",
        scale: float = 0.16,
        label_text: Optional[str] = None,
    ) -> str:
        try:
            doc = fitz.open(input_path)
        except Exception as exc:
            raise PDFProcessingError(f"Error abriendo el documento PDF: {str(exc)}")

        try:
            if doc.is_encrypted:
                raise BusinessRuleError("No se puede estampar un código QR en un PDF protegido con contraseña.")

            target_indices = resolve_target_pages(pages, len(doc))
            clean_label = (label_text or "").strip()[:80]
            clamped_scale = max(0.08, min(0.38, float(scale)))

            for page_idx in target_indices:
                page = doc[page_idx]
                target_rect = compute_box_rect(
                    page.rect,
                    300,
                    300,
                    (position or "bottom-right").strip().lower(),
                    clamped_scale,
                    reserve_bottom_label=bool(clean_label),
                )
                page.insert_image(
                    target_rect,
                    stream=qr_png_bytes,
                    keep_proportion=True,
                    overlay=True,
                )

                if clean_label:
                    label_rect = fitz.Rect(
                        target_rect.x0 - 12,
                        target_rect.y1 + 2,
                        target_rect.x1 + 12,
                        target_rect.y1 + 18,
                    )
                    page.insert_textbox(
                        label_rect,
                        clean_label,
                        fontsize=7.5,
                        fontname="helv",
                        color=(0.15, 0.18, 0.24),
                        align=fitz.TEXT_ALIGN_CENTER,
                        overlay=True,
                    )

            doc.save(output_path, garbage=2, deflate=True)
            return output_path
        except (BusinessRuleError, PDFProcessingError):
            raise
        except Exception as exc:
            raise PDFProcessingError(f"Error estampando el código QR en el PDF: {str(exc)}")
        finally:
            doc.close()

    async def stamp_qr_pdf(
        self,
        input_path: str,
        output_path: str,
        payload: str,
        verify_online: bool = True,
        pages: str = "first",
        position: str = "bottom-right",
        scale: float = 0.16,
        label_text: Optional[str] = None,
    ) -> Tuple[str, Optional[Dict[str, Any]]]:
        clean_payload = (payload or "").strip()
        if not clean_payload:
            raise BusinessRuleError("Debes ingresar una URL o texto para generar el código QR.")

        verification: Optional[Dict[str, Any]] = None
        if verify_online and _looks_like_url(clean_payload):
            verification = await check_url_reachability(clean_payload)
            if not verification.get("reachable"):
                err_msg = verification.get("error") or "La URL no respondió correctamente."
                raise BusinessRuleError(
                    f"Verificación online fallida para la URL del QR: {err_msg} "
                    "Verifica el enlace o desactiva la opción 'Verificar URL en línea antes de estampar'."
                )
            clean_payload = str(verification.get("url") or clean_payload)

        qr_bytes = await run_in_threadpool(generate_qr_png_bytes, clean_payload)
        out = await run_in_threadpool(
            self._stamp_qr_sync,
            input_path,
            output_path,
            qr_bytes,
            pages,
            position,
            scale,
            label_text,
        )
        return out, verification

    @staticmethod
    def _scan_qr_codes_sync(input_path: str) -> Tuple[int, List[Dict[str, Any]]]:
        try:
            doc = fitz.open(input_path)
        except Exception as exc:
            raise PDFProcessingError(f"Error abriendo el documento PDF: {str(exc)}")

        detector = cv2.QRCodeDetector()
        found: List[Dict[str, Any]] = []

        try:
            if doc.is_encrypted:
                raise BusinessRuleError("No se puede inspeccionar un PDF protegido con contraseña.")

            total_pages = len(doc)
            scan_limit = min(total_pages, MAX_QR_INSPECT_PAGES)

            for idx in range(scan_limit):
                page = doc[idx]
                pix = page.get_pixmap(dpi=150, alpha=False)
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
                if pix.n == 3:
                    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
                else:
                    gray = img

                decoded_values: List[str] = []
                try:
                    ok_multi, decoded_info, _, _ = detector.detectAndDecodeMulti(gray)
                    if ok_multi and decoded_info is not None:
                        for val in decoded_info:
                            if val and val.strip():
                                decoded_values.append(val.strip())
                except Exception:
                    pass

                if not decoded_values:
                    try:
                        single_val, _, _ = detector.detectAndDecode(gray)
                        if single_val and single_val.strip():
                            decoded_values.append(single_val.strip())
                    except Exception:
                        pass

                seen_on_page = set()
                for val in decoded_values:
                    if val in seen_on_page:
                        continue
                    seen_on_page.add(val)
                    found.append(
                        {
                            "page": idx + 1,
                            "data": val,
                            "is_url": _looks_like_url(val),
                        }
                    )

            return total_pages, found
        finally:
            doc.close()

    async def inspect_qr_pdf(self, input_path: str, verify_online: bool = True) -> Dict[str, Any]:
        total_pages, items = await run_in_threadpool(self._scan_qr_codes_sync, input_path)

        for item in items:
            if item["is_url"] and verify_online:
                try:
                    item["online_check"] = await check_url_reachability(item["data"], timeout=4.5)
                except BusinessRuleError as exc:
                    item["online_check"] = {
                        "url": item["data"],
                        "final_url": item["data"],
                        "reachable": False,
                        "status_code": None,
                        "content_type": None,
                        "title": None,
                        "elapsed_ms": 0,
                        "error": exc.message,
                    }
            else:
                item["online_check"] = None

        return {
            "page_count": total_pages,
            "qr_count": len(items),
            "items": items,
        }


def get_pdf_qr_service() -> PDFQRService:
    return PDFQRService()
