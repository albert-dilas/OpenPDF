from fastapi import APIRouter
from app.api.v1.endpoints import merge, rotate, split, compress, protect, pdf_to_jpg, pdf_to_word, word_to_pdf, ocr, jpg_to_pdf, unlock, watermark, page_numbers, pdf_to_markdown

api_router = APIRouter()
api_router.include_router(merge.router, prefix="/merge", tags=["Merge PDF"])
api_router.include_router(rotate.router, prefix="/rotate", tags=["Rotate PDF"])
api_router.include_router(split.router, prefix="/split", tags=["Split PDF"])
api_router.include_router(compress.router, prefix="/compress", tags=["Compress PDF"])
api_router.include_router(protect.router, prefix="/protect", tags=["Protect PDF"])
api_router.include_router(pdf_to_jpg.router, prefix="/pdf-to-jpg", tags=["PDF to JPG"])
api_router.include_router(pdf_to_word.router, prefix="/pdf-to-word", tags=["PDF to Word"])
api_router.include_router(word_to_pdf.router, prefix="/word-to-pdf", tags=["Word to PDF"])
api_router.include_router(ocr.router, prefix="/ocr", tags=["OCR PDF"])
api_router.include_router(jpg_to_pdf.router, prefix="/jpg-to-pdf", tags=["JPG to PDF"])
api_router.include_router(unlock.router, prefix="/unlock", tags=["Unlock PDF"])
api_router.include_router(watermark.router, prefix="/watermark", tags=["Watermark PDF"])
api_router.include_router(page_numbers.router, prefix="/page-numbers", tags=["Page Numbers PDF"])
api_router.include_router(pdf_to_markdown.router, prefix="/pdf-to-markdown", tags=["PDF to Markdown"])
