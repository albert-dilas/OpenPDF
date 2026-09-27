from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os

from app.utils.helpers import remove_file
from app.services.page_numbers_pdf import PageNumbersService, get_page_numbers_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.core.exceptions import InvalidFormatError
from app.utils.validators import validate_pdf_bytes

router = APIRouter()

@router.post("/")
async def page_numbers_pdf_endpoint(
    file: UploadFile = File(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    service: PageNumbersService = Depends(get_page_numbers_service)
):
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    output_path = file_manager.create_output_path()
    
    await service.add_page_numbers_pdf(temp_path, output_path)
    
    file_manager.untrack(output_path)
    
    return FileResponse(
        path=output_path,
        filename="numbered.pdf",
        media_type="application/pdf",
        background=BackgroundTask(remove_file, output_path)
    )
