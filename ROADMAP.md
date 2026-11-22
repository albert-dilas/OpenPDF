# Product Roadmap — Tornio (formerly OpenPDF)

Tornio follows a local-first, privacy-first roadmap centered on reliability, zero-clutter workflows, and fast multi-domain desktop execution.

---

## Shipped (`v3.0.0`)

- **7 Integrated Studios · 58 Active Local Tools**:
  - Documents & PDF (`24`), Video Studio (`8`), Audio Studio (`6`), Images Studio (`7`), Files & Dev Lab (`6`), Local AI CPU (`4`), and Anti-SSRF Guarded Web Capture (`3`).
- **Multi-Step Automated Pipelines & Session Files**:
  - Universal local file inspection (`/workspace`) and sequential 1-click pipelines (`/pipelines`) with career workflow templates and local recipe persistence.
- **Precision Core & Accessible Adaptive UI**:
  - Live 6-engine Precision Core dial (`EngineOrb3D`) with hardware telemetry popover, 1-click temp storage purge, Dual-Tone tool icons, frosted geometric Studio glyphs, 4 architectural skins, 8 WCAG-checked accents, reading density controls, and 5 workspace presets.
- **Desktop Lifecycle, Security & Self-Updater**:
  - Optional `ctypes` system tray, optional HKCU Windows startup and `"Abrir con Tornio"` Explorer context menu, Single-Instance file wake, Disk Space Quota Guard, Smart ZIP toggle with Zip-Slip-safe unpack, millisecond subprocess cancellation (`X-Request-Id`), and `SHA-256` verified self-updater (`SHA256SUMS.txt`).
- **Open Source & Legal Governance**:
  - Apache License 2.0 for original Tornio code with transparent `NOTICE` and `THIRD_PARTY_NOTICES.md` (`PyMuPDF` `GNU AGPL v3.0`), `SECURITY.md`, and `CODE_OF_CONDUCT.md`.
- **Official 3D GitHub Pages Website (`docs/index.html`)**:
  - Launched `https://albert-dilas.github.io/Tornio/` with Tornio design tokens (`Porcelain Light` / `Carbon Dark` automatic + manual toggle), bilingual `ES`/`EN` switcher, WebGL 3D Studio scenes and base64 Figma format carousel, searchable 58-tool console, and Windows/Linux download hub with a 4-step real installer guide.

---

## Planned (`v3.1.x`)

- **Cross-Platform Packaging**: Native macOS (`.dmg`) and Linux (`.AppImage` / `.deb` / Flatpak) distribution builds alongside Windows x64.
- **Community-Proposed Tools**: Prioritizing document, media, and security workflows submitted by users through in-app feedback, [GitHub Discussions](https://github.com/albert-dilas/Tornio/discussions), and Issues.
- **Batch Queue Enhancements**: Drag-and-drop multi-file batch queues across Audio, Image, and Documents tools.

---

## Future Vision (`v3.2+`)

- **Portable Pipeline Recipe Sharing**: Signed JSON recipe import/export for sharing repeatable document and media workflows across teams offline.
- **Automated Browser E2E CI Matrix**: Cross-platform end-to-end Playwright matrix running on pull requests alongside backend `pytest` and static Next.js build checks.
- **Isolated Optional Engine Sandboxing**: Modular local worker isolation for heavy ONNX and speech models with zero idle memory overhead.

---

## Suggest a Tool or Vote on Priorities

Have a daily file workflow you want processed offline? Open a thread in [GitHub Discussions](https://github.com/albert-dilas/Tornio/discussions) or submit a request via [GitHub Issues](https://github.com/albert-dilas/Tornio/issues/new?template=feature_request.md).
