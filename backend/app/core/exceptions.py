from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.background import BackgroundTasks

class OpenPDFBaseException(Exception):
    """Excepción base para todos los errores de dominio de la aplicación."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class PDFProcessingError(OpenPDFBaseException):
    """Error lanzado cuando la librería subyacente (ej. PyMuPDF) falla al procesar el documento."""
    pass

class InvalidFormatError(OpenPDFBaseException):
    """Error lanzado cuando el archivo proveído no tiene el formato esperado."""
    pass

class BusinessRuleError(OpenPDFBaseException):
    """Error lanzado cuando no se cumple una regla de negocio (ej. número de archivos insuficientes)."""
    pass

async def global_openpdf_exception_handler(request: Request, exc: OpenPDFBaseException):
    # Log base (para trazabilidad en consola/logs)
    print(f"[{exc.__class__.__name__}] {exc.message} en la ruta {request.url.path}")
    
    # Determinar el status code según el tipo de excepción
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    if isinstance(exc, InvalidFormatError) or isinstance(exc, BusinessRuleError):
        status_code = status.HTTP_400_BAD_REQUEST

    return JSONResponse(
        status_code=status_code,
        content={"detail": exc.message, "error_type": exc.__class__.__name__}
    )

async def global_unhandled_exception_handler(request: Request, exc: Exception):
    print(f"[UnhandledException] {str(exc)} en la ruta {request.url.path}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Ocurrió un error interno inesperado en el servidor."}
    )
