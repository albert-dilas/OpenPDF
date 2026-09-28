# -*- mode: python ; coding: utf-8 -*-
# OpenPDF - PyInstaller Spec
# Genera un ejecutable monolitico: FastAPI backend + Next.js frontend estatico

import os
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules, copy_metadata

PROJECT_ROOT = os.path.abspath(os.path.join(SPECPATH, '..'))

# ─── Datos a incluir ─────────────────────────────────────────────────────────
datas = [
    # Frontend compilado (Next.js static export)
    (os.path.join(PROJECT_ROOT, 'frontend', 'out'), 'frontend/out'),
]

# Agregar datos de pymupdf si existen
datas += collect_data_files('pymupdf')
datas += collect_data_files('fitz')
datas += copy_metadata('python-multipart')

hidden_imports = []
hidden_imports += collect_submodules('python_multipart')
hidden_imports += collect_submodules('multipart')
hidden_imports += [
    # FastAPI & Starlette internals
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.loops.asyncio',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.http.httptools_impl',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'fastapi',
    'fastapi.staticfiles',
    'fastapi.responses',
    'starlette.staticfiles',
    'starlette.responses',
    'starlette.middleware.cors',
    # PyMuPDF
    'fitz',
    'pymupdf',
    'pymupdf4llm',
    # Otros
    'anyio',
    'anyio._backends._asyncio',
    'multipart',
    'python_multipart',
    'email.mime.multipart',
    'email.mime.base',
    'email.mime.text',
]

a = Analysis(
    [os.path.join(PROJECT_ROOT, 'backend', 'app', 'main.py')],
    pathex=[
        os.path.join(PROJECT_ROOT, 'backend'),
    ],
    binaries=[],
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Excluir modulos pesados innecesarios para ahorrar espacio
        'tkinter',
        'matplotlib',
        'scipy',
        'notebook',
        'IPython',
        'pandas',
        'sklearn',
        'tensorflow',
        'torch',
    ],
    noarchive=False,
    optimize=1,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='OpenPDF',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,           # Sin ventana de consola negra
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(PROJECT_ROOT, 'installer', 'openpdf.ico'),
    version_file=os.path.join(PROJECT_ROOT, 'installer', 'version_info.txt'),
)
