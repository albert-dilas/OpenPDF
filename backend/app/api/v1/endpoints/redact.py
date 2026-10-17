from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.services.pdf_redact import PDFRedactService, get_pdf_redact_service
from app.utils.helpers import remove_file
from app.utils.validators import validate_pdf_bytes

router = APIRouter()


@router.post("/")
async def redact_pdf_endpoint(
    file: UploadFile = File(...),
    terms: Optional[str] = Form(None),
    redact_emails: bool = Form(False),
    redact_phones: bool = Form(False),
    redact_ids: bool = Form(False),
    redact_urls: bool = Form(False),
    fill_color: str = Form("black"),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    redact_service: PDFRedactService = Depends(get_pdf_redact_service),
):
    """Censura y elimina de forma permanente términos o patrones sensibles en un PDF."""
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    output_path = file_manager.create_output_path(extension=".pdf")

    _, redacted_count = await redact_service.redact_pdf(
        input_path=temp_path,
        output_path=output_path,
        terms=terms,
        redact_emails=redact_emails,
        redact_phones=redact_phones,
        redact_ids=redact_ids,
        redact_urls=redact_urls,
        fill_color=fill_color,
    )

    file_manager.untrack(output_path)

    return FileResponse(
        path=output_path,
        filename="redacted.pdf",
        media_type="application/pdf",
        headers={"X-Redacted-Count": str(redacted_count)},
        background=BackgroundTask(remove_file, output_path),
    )
