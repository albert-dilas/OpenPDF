from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os

from app.services.pdf_compressor import PDFCompressorService, get_pdf_compressor_service
from app.core.dependencies import TempFileManager, get_temp_file_manager
from app.utils.validators import validate_pdf_bytes
from app.utils.helpers import remove_file

router = APIRouter()


@router.post("/")
async def compress_pdf_endpoint(
    file: UploadFile = File(...),
    file_manager: TempFileManager = Depends(get_temp_file_manager),
    compressor_service: PDFCompressorService = Depends(get_pdf_compressor_service)
):
    temp_path = await file_manager.save_upload_file(file, validate_fn=validate_pdf_bytes)
    output_path = file_manager.create_output_path()

    original_size = os.path.getsize(temp_path)

    await compressor_service.compress_pdf(temp_path, output_path)

    compressed_size = os.path.getsize(output_path)
    ratio = (1 - compressed_size / original_size) * 100 if original_size > 0 else 0

    file_manager.untrack(output_path)

    return FileResponse(
        path=output_path,
        filename="compressed.pdf",
        media_type="application/pdf",
        headers={
            "X-Original-Size": str(original_size),
            "X-Compressed-Size": str(compressed_size),
            "X-Compression-Ratio": f"{ratio:.1f}",
        },
        background=BackgroundTask(remove_file, output_path),
    )
