from typing import Optional
from fastapi import APIRouter, Request, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.services.pdf_metadata import PDFMetadataService, get_pdf_metadata_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.utils.validators import validate_pdf_bytes
from app.utils.helpers import remove_file

router = APIRouter()


@router.post("/")
async def update_metadata_endpoint(
    request: Request,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    keywords: Optional[str] = Form(None),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    metadata_service: PDFMetadataService = Depends(get_pdf_metadata_service),
):
    """Actualiza los metadatos estándar de un archivo PDF."""
    form = await request.form()
    resolved_title = str(form["title"]) if "title" in form and title is None else title
    resolved_author = str(form["author"]) if "author" in form and author is None else author
    resolved_subject = str(form["subject"]) if "subject" in form and subject is None else subject
    resolved_keywords = str(form["keywords"]) if "keywords" in form and keywords is None else keywords

    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    output_path = file_manager.create_output_path(extension=".pdf")

    await metadata_service.update_metadata(
        temp_path,
        output_path,
        title=resolved_title,
        author=resolved_author,
        subject=resolved_subject,
        keywords=resolved_keywords,
    )

    file_manager.untrack(output_path)

    return FileResponse(
        path=output_path,
        filename="metadata_updated.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path),
    )
