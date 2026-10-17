from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.services.pdf_organizer import PDFOrganizerService, get_pdf_organizer_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.utils.validators import validate_pdf_bytes
from app.utils.helpers import remove_file

router = APIRouter()


@router.post("/")
async def organize_pdf_endpoint(
    file: UploadFile = File(...),
    pages: str = Form(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    organizer_service: PDFOrganizerService = Depends(get_pdf_organizer_service),
):
    """Reordena, rota y/o elimina páginas de un PDF según la especificación JSON `pages`."""
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    output_path = file_manager.create_output_path(extension=".pdf")

    await organizer_service.organize_pdf(temp_path, output_path, pages)

    file_manager.untrack(output_path)

    return FileResponse(
        path=output_path,
        filename="organized.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path),
    )
