# Changelog

All notable changes to Tornio (formerly OpenPDF) are documented in this file following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and Semantic Versioning.

## [3.0.0] - 2026-11-21

### Added
- **Rebrand & Architecture Expansion (7 Studios, 58 Active Tools)**:
  - **Documents & PDF (24)**: All v2.x PDF tools plus `pdf-diff` (visual + text revision diff), `pdf-tables-csv`, and `pdf-repair`.
  - **Video Studio (8)**: Dedicated `ffprobe` + visual IN/OUT trim workbench with live SSE queue plus 7 tools (`video-to-gif`, `video-extract-audio`, `video-compress`, `video-thumbnails`, `video-burn-subtitles`, `video-merge`, `video-speed`).
  - **Audio Studio (6)**: Format conversion, precision trim/fade, EBU R128 loudness normalization, noise filter, track merge, and ID3 tag editor.
  - **Images Studio (7)**: WebP/AVIF converter + document scan sharpness enhancer, optimizer, resize/crop, EXIF/GPS scrubber, local U2NetP ONNX / OpenCV background removal, ICO/Favicon builder, and color palette inspector.
  - **Files & Dev Lab (6)**: ZIP/TAR inspector, SHA-256 verifier, `Scrypt + AES-256-GCM` Local Encrypted Vault, JSON/YAML/CSV transformer, offline regex/diff lab, and batch SVG/PNG QR generator.
  - **Local AI CPU (4)**: Offline Whisper CPU transcription (`SRT`/`TXT`), local Windows SAPI5 TTS narration, extractive document summarization, and RAG chunker.
  - **Web & Online Capture (3)**: `yt-dlp` stream archiver, clean Web-to-Markdown clipper, and HTTP/TLS redirect inspector guarded by hop-by-hop Anti-SSRF (`safe_public_get`).
- **Session Files & Linear Pipelines**: Unified universal file inspection (`/workspace`), cross-tool 1-click chaining, 5 career workflow templates (`/pipelines`), custom step builder, and local recipe persistence.
- **Precision Core & Modern Visual System**:
  - Calibrated **Precision Core** instrument on Home showing live 6-engine perimeter segments, processing progress, hardware/disk popover telemetry, quick temp purge, and direct drag-and-drop file inspection.
  - Dual-Tone architectural tool icons (`ToolIcon.tsx`), frosted geometric Studio glyphs (`StudioTile3D.tsx`), 4 architectural skins (`Porcelain`, `Carbon`, `Swiss Graphite`, `System`), 8 WCAG-checked accent colors, reading density selector (`A- / A / A+`), and 5 career workspace presets.
  - Accessible `QuickFeedbackModal` in everyday language accessible directly from the sidebar and Studio footers.
- **Desktop Lifecycle, Security & Self-Updater**:
  - Configurable close behavior (default full exit with 0 background RAM, or optional native `ctypes` Windows System Tray), optional HKCU Windows autostart, and `"Abrir con Tornio"` right-click Explorer integration.
  - Single-instance lock with instant window wake and CLI file ingestion.
  - Cryptographic Auto-Updater (`notify` / `auto` / `manual` offline mode) enforcing HTTPS GitHub allowlist and mandatory `SHA-256` verification against `SHA256SUMS.txt`.
  - Pre-flight Disk Space Quota Guard, Fixed-Folder quick save with collision-safe numbering, Smart ZIP toggle, real millisecond subprocess cancellation (`X-Request-Id`), and minimalist 3-step Inno Setup 6 installer (`Tornio_Installer.iss`) synced with `%LOCALAPPDATA%\Tornio\config.json`.
- **Open Source & Legal Governance**:
  - Migrated Tornio original code to **Apache License 2.0**, accompanied by `NOTICE`, `THIRD_PARTY_NOTICES.md` (explicit `PyMuPDF` `GNU AGPL v3.0` combined binary compliance disclosure), `SECURITY.md`, and `CODE_OF_CONDUCT.md`.

## [2.2.0] - 2026-10-18

### Added
- Initial 21-module Local-First PDF desktop suite (`OpenPDF.exe` and `OpenPDF_Setup_v2.2.0.exe`).
- 1-Click Local Engines Center (`Tesseract OCR` + Spanish language download, `MS Word COM` + `LibreOffice` dual Word-to-PDF conversion).
- Settings view, non-blocking GitHub Releases update checker, local feedback logger, and anti-SSRF online URL utilities.
