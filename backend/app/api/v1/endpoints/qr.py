from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.services.pdf_qr import PDFQRService, get_pdf_qr_service
from app.utils.helpers import remove_file
from app.utils.network import check_url_reachability
from app.utils.validators import validate_pdf_bytes

router = APIRouter()


@router.post("/verify-url")
async def verify_qr_url_endpoint(
    url: str = Form(...),
):
    """Verifica en línea que una URL destino de QR sea válida y accesible (con protección SSRF)."""
    return await check_url_reachability(url)


@router.post("/stamp")
async def stamp_qr_pdf_endpoint(
    file: UploadFile = File(...),
    payload: str = Form(...),
    verify_online: bool = Form(True),
    pages: str = Form("first"),
    position: str = Form("bottom-right"),
    scale: float = Form(0.16),
    label_text: Optional[str] = Form(None),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    qr_service: PDFQRService = Depends(get_pdf_qr_service),
):
    """Genera y estampa un código QR sobre un PDF verificando opcionalmente la URL en línea."""
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    output_path = file_manager.create_output_path(extension=".pdf")

    _, verification = await qr_service.stamp_qr_pdf(
        input_path=temp_path,
        output_path=output_path,
        payload=payload,
        verify_online=verify_online,
        pages=pages,
        position=position,
        scale=scale,
        label_text=label_text,
    )

    file_manager.untrack(output_path)

    headers = {
        "X-QR-Verified": "true" if (verification and verification.get("reachable")) else "false"
    }

    return FileResponse(
        path=output_path,
        filename="qr_stamped.pdf",
        media_type="application/pdf",
        headers=headers,
        background=BackgroundTask(remove_file, output_path),
    )


@router.post("/inspect")
async def inspect_qr_pdf_endpoint(
    file: UploadFile = File(...),
    verify_online: bool = Form(True),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    qr_service: PDFQRService = Depends(get_pdf_qr_service),
):
    """Escanea todas las páginas del PDF buscando códigos QR y comprueba sus enlaces en línea."""
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    return await qr_service.inspect_qr_pdf(temp_path, verify_online=verify_online)
