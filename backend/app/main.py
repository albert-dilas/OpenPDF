from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
import asyncio
import os
import time


TEMP_FILE_MAX_AGE_SECONDS = 3600  # 1 hora


async def cleanup_old_temp_files():
    """Tarea periódica que elimina archivos temporales huérfanos (más de 1 hora de antigüedad)."""
    while True:
        await asyncio.sleep(3600)
        now = time.time()
        try:
            for filename in os.listdir(settings.TEMP_DIR):
                filepath = os.path.join(settings.TEMP_DIR, filename)
                if os.path.isfile(filepath):
                    file_age = now - os.path.getmtime(filepath)
                    if file_age > TEMP_FILE_MAX_AGE_SECONDS:
                        os.remove(filepath)
        except Exception as e:
            print(f"Error durante limpieza periódica de temp_files: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manejo del ciclo de vida de la aplicación (startup y shutdown)."""
    # Startup: limpiar archivos temp que sobrevivieron reinicios anteriores
    try:
        now = time.time()
        for filename in os.listdir(settings.TEMP_DIR):
            filepath = os.path.join(settings.TEMP_DIR, filename)
            if os.path.isfile(filepath):
                file_age = now - os.path.getmtime(filepath)
                if file_age > TEMP_FILE_MAX_AGE_SECONDS:
                    os.remove(filepath)
    except Exception as e:
        print(f"Error durante limpieza inicial: {e}")

    cleanup_task = asyncio.create_task(cleanup_old_temp_files())

    yield

    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for OpenPDF",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check():
    """Endpoint de salud para verificar que el servidor está funcionando."""
    try:
        temp_files_count = len([
            f for f in os.listdir(settings.TEMP_DIR)
            if os.path.isfile(os.path.join(settings.TEMP_DIR, f))
        ])
    except Exception:
        temp_files_count = -1

    return {
        "status": "ok",
        "temp_files": temp_files_count,
    }


# Servir el frontend compilado (Si existe la carpeta)
frontend_dist = os.path.join(settings.BASE_DIR.parent, "frontend", "out")
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    next_dist = os.path.join(frontend_dist, "_next")
    if os.path.exists(next_dist):
        app.mount("/_next", StaticFiles(directory=next_dist), name="next_assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        path = os.path.join(frontend_dist, full_path)
        if os.path.exists(path) and os.path.isfile(path):
            return FileResponse(path)

        html_path = f"{path}.html"
        if os.path.exists(html_path) and os.path.isfile(html_path):
            return FileResponse(html_path)

        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == '__main__':
    import uvicorn
    import threading
    import webbrowser
    import time

    def open_browser():
        time.sleep(1.5)
        webbrowser.open('http://127.0.0.1:8000')

    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run('app.main:app', host='127.0.0.1', port=8000, reload=False)
