from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.services.pdf_sign import PDFSignService, get_pdf_sign_service
from app.utils.helpers import remove_file
from app.utils.validators import validate_pdf_bytes, validate_image_bytes

router = APIRouter()


@router.post("/")
async def sign_pdf_endpoint(
    file: UploadFile = File(...),
    signature: UploadFile = File(...),
    pages: str = Form("last"),
    position: str = Form("bottom-right"),
    scale: float = Form(0.22),
    label_text: Optional[str] = Form(None),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    sign_service: PDFSignService = Depends(get_pdf_sign_service),
):
    """Estampa una imagen de firma o sello sobre las páginas seleccionadas de un PDF."""
    pdf_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    sig_path = await file_manager.save_upload_file(signature, validate_fn=validate_image_bytes)
    output_path = file_manager.create_output_path(extension=".pdf")

    await sign_service.sign_pdf(
        input_path=pdf_path,
        signature_path=sig_path,
        output_path=output_path,
        pages=pages,
        position=position,
        scale=scale,
        label_text=label_text,
    )

    file_manager.untrack(output_path)

    return FileResponse(
        path=output_path,
        filename="signed.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path),
    )
