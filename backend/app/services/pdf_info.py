import base64
from typing import Any, Dict, List
import fitz
from fastapi.concurrency import run_in_threadpool
from app.core.exceptions import PDFProcessingError

MAX_THUMBNAIL_PAGES = 300
THUMBNAIL_TARGET_WIDTH = 160.0


def _empty_metadata() -> Dict[str, str]:
    return {
        "title": "",
        "author": "",
        "subject": "",
        "keywords": "",
        "creator": "",
        "producer": "",
    }


class PDFInfoService:
    @staticmethod
    def _get_info_sync(input_path: str) -> Dict[str, Any]:
        try:
            doc = fitz.open(input_path)
        except Exception as e:
            raise PDFProcessingError(f"Error abriendo PDF: {str(e)}")

        try:
            encrypted = bool(doc.is_encrypted)
            try:
                page_count = int(doc.page_count)
            except Exception:
                page_count = 0

            if encrypted:
                return {
                    "page_count": page_count,
                    "encrypted": True,
                    "metadata": _empty_metadata(),
                    "pages": [],
                }

            raw_meta = doc.metadata or {}
            metadata = {
                "title": str(raw_meta.get("title") or ""),
                "author": str(raw_meta.get("author") or ""),
                "subject": str(raw_meta.get("subject") or ""),
                "keywords": str(raw_meta.get("keywords") or ""),
                "creator": str(raw_meta.get("creator") or ""),
                "producer": str(raw_meta.get("producer") or ""),
            }

            pages: List[Dict[str, Any]] = []
            for idx, page in enumerate(doc):
                rect = page.rect
                width = round(float(rect.width), 2)
                height = round(float(rect.height), 2)
                rotation = int(page.rotation or 0) % 360

                thumbnail = None
                if idx < MAX_THUMBNAIL_PAGES:
                    scale = THUMBNAIL_TARGET_WIDTH / max(float(rect.width), 1.0)
                    matrix = fitz.Matrix(scale, scale)
                    pix = page.get_pixmap(matrix=matrix, alpha=False)
                    jpg_bytes = pix.tobytes("jpeg")
                    b64 = base64.b64encode(jpg_bytes).decode("ascii")
                    thumbnail = f"data:image/jpeg;base64,{b64}"

                pages.append(
                    {
                        "index": idx,
                        "width": width,
                        "height": height,
                        "rotation": rotation,
                        "thumbnail": thumbnail,
                    }
                )

            return {
                "page_count": page_count,
                "encrypted": False,
                "metadata": metadata,
                "pages": pages,
            }
        except PDFProcessingError:
            raise
        except Exception as e:
            raise PDFProcessingError(f"Error leyendo información del PDF: {str(e)}")
        finally:
            doc.close()

    async def get_pdf_info(self, input_path: str) -> Dict[str, Any]:
        return await run_in_threadpool(self._get_info_sync, input_path)


def get_pdf_info_service() -> PDFInfoService:
    return PDFInfoService()
