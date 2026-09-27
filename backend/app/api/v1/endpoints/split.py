from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from typing import Optional
from starlette.background import BackgroundTask

from app.services.pdf_splitter import PDFSplitterService, get_pdf_splitter_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.utils.validators import validate_pdf_bytes
from app.utils.helpers import remove_file

router = APIRouter()


@router.post("/")
async def split_pdf_endpoint(
    file: UploadFile = File(...),
    page_ranges: Optional[str] = Form(None),  # ← NUEVO: ej. "1,3-5,7"
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    splitter_service: PDFSplitterService = Depends(get_pdf_splitter_service),
):
    """
    Divide un PDF en páginas individuales (ZIP).

    Args:
        file: Archivo PDF a dividir.
        page_ranges: Opcional. Rango de páginas en formato "1,3-5,7".
                     Si se omite, se extraen todas las páginas.
    """
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    output_path = file_manager.create_output_path(extension=".zip")

    await splitter_service.split_pdf_to_zip(temp_path, output_path, page_ranges)

    file_manager.untrack(output_path)

    return FileResponse(
        path=output_path,
        filename="split_pages.zip",
        media_type="application/zip",
        background=BackgroundTask(remove_file, output_path),
    )
