from fastapi import APIRouter, Form, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.services.url_to_pdf import URLToPDFService, get_url_to_pdf_service
from app.utils.helpers import remove_file

router = APIRouter()


@router.post("/")
async def url_to_pdf_endpoint(
    url: str = Form(...),
    mode: str = Form("reader"),
    page_size: str = Form("a4"),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    url_service: URLToPDFService = Depends(get_url_to_pdf_service),
):
    """Captura una página web pública por URL y la convierte a PDF (con protección SSRF)."""
    output_path = file_manager.create_output_path(extension=".pdf")

    await url_service.convert_url_to_pdf(
        url=url,
        output_path=output_path,
        mode=mode,
        page_size=page_size,
    )

    file_manager.untrack(output_path)

    return FileResponse(
        path=output_path,
        filename="web_captura.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path),
    )
