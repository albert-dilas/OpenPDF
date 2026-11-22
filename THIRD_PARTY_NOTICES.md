# Third-Party Software Notices and Licenses

Tornio original source code is licensed under the **Apache License, Version 2.0**.
Prebuilt Windows executables and installers incorporate open-source libraries
governed by their own licenses, as documented below.

The complete corresponding source code of Tornio and build instructions are
available at: https://github.com/albert-dilas/Tornio

---

## 1. Bundled Core Libraries (Included in Compiled Binaries)

### PDF Engine (Copyleft Compliance Notice)
| Component | Version (Manifest) | License | Purpose in Tornio |
| :--- | :--- | :--- | :--- |
| `pymupdf` (`fitz`) | `1.28.2` | **GNU AGPL v3.0** | High-speed PDF rendering, page geometry, redaction, signing, repair |
| `pymupdf-layout` | `1.28.2` | **GNU AGPL v3.0** | Document layout extraction support |
| `pymupdf4llm` | `1.28.2` | **GNU AGPL v3.0** | PDF to structured Markdown conversion |

> **AGPL-3.0 Compliance Disclosure**: Because prebuilt desktop binaries bundle PyMuPDF, combined binary distributions as a whole are made available alongside the complete corresponding source code of Tornio in the public GitHub repository (`https://github.com/albert-dilas/Tornio`). Downstream redistributors of compiled binaries incorporating PyMuPDF must likewise comply with GNU AGPL v3.0 obligations or obtain a commercial license from Artifex Software.

### Backend Runtime, Security & Media Libraries
| Component | Version (Manifest) | License | Purpose |
| :--- | :--- | :--- | :--- |
| `fastapi` | `0.141.1` | MIT | Local HTTP/SSE API engine (`127.0.0.1`) |
| `starlette` | `1.7.0` | BSD-3-Clause | ASGI toolkit and static asset serving |
| `uvicorn` | `0.54.0` | BSD-3-Clause | Local ASGI server |
| `pydantic` / `pydantic_core` | `2.13.5` / `2.46.5` | MIT | Schema validation |
| `httpx` / `httpcore` / `h11` | `0.28.1` / `1.0.9` / `0.16.0` | BSD-3-Clause / MIT | Anti-SSRF HTTP client and GitHub Releases updater |
| `anyio` | `4.15.1` | MIT | Structured async concurrency |
| `cryptography` | `50.0.2` | Apache-2.0 or BSD-3-Clause | AES-256-GCM + Scrypt local vault encryption |
| `pillow` | `12.3.0` | MIT-CMU / HPND | Image conversion, EXIF scrub, optimization, ICO |
| `opencv-python-headless` | `5.0.0.93` | Apache-2.0 | Document scan enhancement and image processing |
| `numpy` | `2.5.3` | BSD-3-Clause | Pixel array transforms |
| `onnxruntime` | `1.30.0` | MIT | Local CPU inference for U2NetP background matting |
| `pytesseract` | `0.3.13` | Apache-2.0 | Python wrapper for Tesseract OCR |
| `pdf2docx` | `0.5.13` | MIT | PDF to Word conversion |
| `pdf2image` | `1.17.0` | MIT | Page rasterization bridge |
| `python-docx` | `1.2.0` | MIT | DOCX document reading/manipulation |
| `lxml` | `6.1.3` | BSD-3-Clause | Safe XML/HTML parsing |
| `qrcode` | `8.2` | BSD-3-Clause | Local vector SVG / PNG QR generation |
| `PyYAML` | `6.0.3` | MIT | Structured data conversion (YAML/JSON/CSV) |
| `psutil` | `7.2.2` | BSD-3-Clause | Local CPU/RAM telemetry |
| `packaging` | `26.3` | Apache-2.0 or BSD-2-Clause | SemVer version comparison |
| `python-multipart` | `0.0.32` | Apache-2.0 | Streaming multipart file upload parsing |
| `certifi` | `2026.7.22` | MPL-2.0 | Mozilla CA root bundle for TLS |

### Frontend & UI Stack (Compiled into Static Offline Export `frontend/out`)
| Component | Version (Manifest) | License | Purpose |
| :--- | :--- | :--- | :--- |
| `next` | `14.2.35` | MIT | Static React application export |
| `react` / `react-dom` | `^18` | MIT | Component UI runtime |
| `zustand` | `^5.0.15` | MIT | Client settings and state machines |
| `axios` | `^1.20.0` | MIT | Local API transport with cancellation signals |
| `lucide-react` | `^1.48.0` | ISC | Monochrome SVG icon set |
| `react-hot-toast` | `^2.6.1` | MIT | Minimal toast notifications |
| `tailwindcss` | `^3.4.1` | MIT | Utility CSS design system |

---

## 2. Optional External Engines (Not Bundled Inside Binary)

These tools are **not** statically bundled inside `Tornio.exe` or `Tornio_Setup_vX.Y.Z.exe`. Users may connect their own local installations or trigger optional installation directly on their machine:

| External Engine | License | Installation Method |
| :--- | :--- | :--- |
| `Tesseract OCR` | Apache-2.0 | User system path or WinGet (`UB-Mannheim.TesseractOCR`) |
| `LibreOffice` | MPL-2.0 | User system path or WinGet (`TheDocumentFoundation.LibreOffice`) |
| `FFmpeg` / `ffprobe` | LGPL-2.1+ or GPL-2.0+ (build dependent) | User system path or WinGet (`Gyan.FFmpeg`) |
| `yt-dlp` | Unlicense | User binary directory or WinGet (`yt-dlp.yt-dlp`) |
| `faster-whisper` (CTranslate2) | MIT | Isolated local Python venv (`%LOCALAPPDATA%\Tornio\modules\ai-venv`) |
| `u2netp.onnx` model | Apache-2.0 / MIT (Rembg / U2-Net) | Downloaded on user demand into `%LOCALAPPDATA%\Tornio\models` |
