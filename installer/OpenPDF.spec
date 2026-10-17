# -*- mode: python ; coding: utf-8 -*-
# OpenPDF v2.0 - PyInstaller Spec
# Genera un ejecutable monolítico: FastAPI backend + Next.js frontend estático

import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules, copy_metadata

PROJECT_ROOT = os.path.abspath(os.path.join(SPECPATH, ".."))

datas = [
    (os.path.join(PROJECT_ROOT, "frontend", "out"), "frontend/out"),
]

for pkg in ("pymupdf", "fitz", "pymupdf4llm"):
    try:
        datas += collect_data_files(pkg)
    except Exception:
        pass

for meta_pkg in ("python-multipart", "fastapi", "uvicorn", "pymupdf"):
    try:
        datas += copy_metadata(meta_pkg)
    except Exception:
        pass

hidden_imports = []
for sub_pkg in ("app", "python_multipart", "pdf2docx", "pymupdf4llm", "qrcode", "lxml"):
    try:
        hidden_imports += collect_submodules(sub_pkg)
    except Exception:
        pass

hidden_imports += [
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.loops.asyncio",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.http.h11_impl",
    "uvicorn.protocols.http.httptools_impl",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "fastapi",
    "fastapi.staticfiles",
    "fastapi.responses",
    "starlette.staticfiles",
    "starlette.responses",
    "starlette.middleware.cors",
    "fitz",
    "pymupdf",
    "pymupdf4llm",
    "anyio",
    "anyio._backends._asyncio",
    "python_multipart",
    "httpx",
    "qrcode",
    "lxml",
    "lxml.html",
    "packaging",
    "packaging.version",
    "email.mime.multipart",
    "email.mime.base",
    "email.mime.text",
]

a = Analysis(
    [os.path.join(PROJECT_ROOT, "backend", "app", "main.py")],
    pathex=[
        os.path.join(PROJECT_ROOT, "backend"),
    ],
    binaries=[],
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        "tkinter",
        "matplotlib",
        "scipy",
        "notebook",
        "IPython",
        "pandas",
        "sklearn",
        "tensorflow",
        "torch",
        "pytest",
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
    name="OpenPDF",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(PROJECT_ROOT, "installer", "openpdf.ico"),
    version_file=os.path.join(PROJECT_ROOT, "installer", "version_info.txt"),
)
