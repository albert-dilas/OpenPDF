<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/banner.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/banner-light.png">
    <img src="assets/banner.png" alt="Tornio v3.0.0 - Suite de Escritorio Local-First" width="100%">
  </picture>
  <br><br>

  <h1>Tornio <small>(antes OpenPDF)</small></h1>

  <p>
    <a href="README.md">Read in English</a>
    &nbsp;|&nbsp;
    <a href="https://albert-dilas.github.io/Tornio/">Sitio Web Oficial</a>
    &nbsp;|&nbsp;
    <a href="https://github.com/albert-dilas/Tornio/releases/tag/v3.0.0">Descargas y Releases (v3.0.0)</a>
    &nbsp;|&nbsp;
    <a href="https://github.com/albert-dilas/Tornio/discussions">Comunidad y Debates</a>
  </p>

  <p>
    <a href="https://github.com/albert-dilas/Tornio/releases/tag/v3.0.0"><img src="https://img.shields.io/badge/Release-v3.0.0-E04826.svg" alt="Release v3.0.0"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache--2.0-2563EB.svg" alt="Licencia Apache 2.0"></a>
    <a href="https://github.com/albert-dilas/Tornio/actions/workflows/ci.yml"><img src="https://github.com/albert-dilas/Tornio/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
    <img src="https://img.shields.io/badge/Platform-Windows%20x64%20%7C%20C%C3%B3digo%20Fuente-18181B.svg" alt="Plataforma Windows x64">
    <img src="https://img.shields.io/badge/Architecture-Local--First%20(127.0.0.1)-10B981.svg" alt="Arquitectura Local-First">
    <img src="https://img.shields.io/badge/Suite-7%20Studios%20%C2%B7%2058%20Herramientas-3F3F46.svg" alt="7 Studios y 58 Herramientas">
  </p>

  <p>
    <strong>Suite de escritorio gratuita y de código abierto bajo arquitectura <code>[LOCAL-FIRST]</code> para documentos, video, audio, imágenes, utilidades de seguridad e IA local por CPU.</strong><br>
    Todo el procesamiento se ejecuta en privado sobre <code>127.0.0.1</code> sin subir archivos ni metadatos a servidores externos.
  </p>
</div>

---

## Descarga y Verificación Criptográfica (`v3.0.0`)

Los binarios oficiales para Windows x64 empaquetan el motor FastAPI en Python, librerías de procesamiento, soporte de bandeja del sistema y la interfaz estática offline Next.js de 76 rutas sin necesidad de instalar Python ni Node.js.

| Archivo | Formato | Tamaño | Digest SHA-256 | Descarga |
| :--- | :--- | :---: | :--- | :---: |
| **`Tornio_Setup_v3.0.0.exe`** | Instalador Windows por usuario (asistente de 3 pasos, sin UAC) | `158.0 MB` | `01bb6bace0d2c9117c458a8e20e1b14f1b433ac3ed87ac087e72071c79e91b0f` | [Descargar Instalador](https://github.com/albert-dilas/Tornio/releases/download/v3.0.0/Tornio_Setup_v3.0.0.exe) |
| **`Tornio.exe`** | Ejecutable Portátil Independiente | `161.1 MB` | `fd01ed51c06ebfe9d2598c764488a9e6975c589a5f54d5cc4cfa2cb7eb4df684` | [Descargar Portátil](https://github.com/albert-dilas/Tornio/releases/download/v3.0.0/Tornio.exe) |
| **`SHA256SUMS.txt`** | Manifiesto de Integridad (verificado por el auto-actualizador) | — | — | [Ver Manifiesto](https://github.com/albert-dilas/Tornio/releases/download/v3.0.0/SHA256SUMS.txt) |

Verifica la integridad en PowerShell antes de ejecutar:

```powershell
Get-FileHash .\Tornio_Setup_v3.0.0.exe -Algorithm SHA256
```

> **Usuarios previos de OpenPDF v2.x**: Tornio migra automáticamente `%LOCALAPPDATA%\OpenPDF\config.json` y `tessdata\*.traineddata` hacia `%LOCALAPPDATA%\Tornio` en el primer arranque sin sobrescribir configuraciones ya existentes.

---

## Vista Previa de la Interfaz (Modo Claro y Oscuro Automático)

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/overview-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/overview-light.png">
    <img src="assets/overview-dark.png" alt="Panel Principal de Tornio y Núcleo de Precisión" width="100%">
  </picture>
  <br>
  <em>Figura 1: Panel principal de Tornio con Núcleo de Precisión calibrado (telemetría de 6 motores y zona drop), 7 Studios, perfiles por rubro y atajos Alt+1..9.</em>
</div>

<br>

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/tools-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/tools-light.png">
    <img src="assets/tools-dark.png" alt="Estudio de Documentos y PDF" width="100%">
  </picture>
  <br>
  <em>Figura 2: Estudio de Documentos y PDF con estado vivo de motores locales (OCR / Word a PDF) y tarjetas Dual-Tone.</em>
</div>

<br>

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/workflow-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/workflow-light.png">
    <img src="assets/workflow-dark.png" alt="Flujos Automáticos Locales" width="100%">
  </picture>
  <br>
  <em>Figura 3: Constructor de flujos multipaso que encadena transformaciones locales en 1 clic sin subir archivos.</em>
</div>

---

## 7 Studios y 58 Herramientas Locales

Tornio agrupa 58 herramientas activas (`TOOL_COUNT = 58`) en 7 Studios especializados dentro de un mismo entorno:

| Studio | Herramientas | Capacidades y Motores Locales | Ejecución |
| :--- | :---: | :--- | :--- |
| **Documentos y PDF** | `24` | Unir, Dividir, Organizar, Rotar, Comprimir, OCR (Tesseract), Reparar/Linealizar, PDF a Word/JPG/Markdown/Tablas CSV, Word a PDF (MS Word COM / LibreOffice), Marca de Agua, Numeración, Metadatos, Comparador visual/texto (`pdf-diff`), Firma/Sello, Censura física irreversible, Cifrado/Desbloqueo AES, Web a PDF, Traducir PDF, QR en PDF | 21 100% Offline, 3 Web Anti-SSRF |
| **Estudio de Video** | `8` | Mesa interactiva `ffprobe` + recorte IN/OUT con cola SSE en vivo, Video a GIF, Extraer Audio, Comprimir/Transcodificar, Mosaico de Miniaturas, Quemar Subtítulos, Unir Clips, Multiplicador de Velocidad (`FFmpeg`) | 100% Offline (Motor Local) |
| **Estudio de Audio** | `6` | Conversión de formatos (`MP3`/`WAV`/`FLAC`/`OGG`/`M4A`), Recorte de precisión/Fade, Normalización EBU R128, Filtro anti-ruido, Unir Pistas, Editor ID3 (`FFmpeg`) | 100% Offline (Motor Local) |
| **Estudio de Imágenes** | `7` | Conversor WebP/AVIF y realce de nitidez para escaneos, Optimizador, Redimensionar/Recortar, Limpiador EXIF/GPS, Quitar Fondo local (`U2NetP` ONNX / OpenCV), Constructor ICO/Favicon, Inspector de Paleta | 100% Offline |
| **Archivos y Dev Lab** | `6` | Inspector/Empaquetador ZIP/TAR/GZ, Verificador SHA-256, Bóveda Cifrada local (`Scrypt + AES-256-GCM`), Transformador JSON/YAML/CSV/XML, Laboratorio Regex y Diff de texto, Generador QR por lotes SVG/PNG | 100% Offline |
| **IA Local** | `4` | Transcripción de voz en CPU (`faster-whisper` -> `SRT`/`TXT`), Narración TTS local con Windows `SAPI5`, Resumen extractivo de documentos, Fragmentador RAG | 100% Offline |
| **Captura Web y Red** | `3` | Archivador multimedia (`yt-dlp`), Extractor Web a Markdown limpio, Inspector HTTP/Redirecciones y TLS (`safe_public_get` Anti-SSRF) | Web Intencional + Anti-SSRF |

---

## Capacidades Clave de Ingeniería y Escritorio

- **Núcleo de Precisión Calibrado (`EngineOrb3D`)**: Anillo de 6 segmentos reales para motores locales, progreso dinámico de ejecución, panel emergente de telemetría (CPU, RAM, disco libre, purga rápida de temporales) e inspección instantánea al soltar archivos.
- **Archivos de Sesión y Flujos Multipaso**: Inspección universal en `/workspace`, encadenamiento entre herramientas con 1 clic y 5 plantillas listas por rubro en `/pipelines`.
- **Ciclo de Vida Configurable en Windows**:
  - **Cierre Total por Defecto (`keep_in_background: false`)**: Al cerrar la ventana se detiene el servidor local sin consumo en segundo plano; opción configurable de Bandeja del Sistema nativa vía `ctypes`.
  - **Inicio con Windows y Menú Contextual**: Activación opcional por usuario en HKCU (autoarranque y `"Abrir con Tornio"` en el Explorador de Windows, sin permisos UAC).
  - **Instancia Única**: Relanzar `Tornio.exe` o abrir archivos desde el Explorador enfoca la ventana activa y carga los archivos vía `/api/v1/system/open-window`.
- **Auto-Actualizador Criptográfico (`SelfUpdaterManager`)**: Modos `notify`, `auto` y `manual` offline (`timeout <= 3s`, caché de 6 horas). Restringe descargas a hosts oficiales de GitHub por HTTPS y exige coincidencia exacta `SHA-256` contra `SHA256SUMS.txt` antes de ejecutar.
- **Protecciones Operativas**: Carga en streaming de `1 MiB` con validación por *magic bytes*, **Guardia de Cuota de Disco** previa al proceso, guardado secuencial sin colisiones, opción **ZIP Inteligente** con desempaquetado seguro anti Zip-Slip en subcarpeta dedicada, cancelación real de subprocesos en milisegundos (`X-Request-Id`) y máquinas de estados finitos (`fsm.ts`).

---

## Tornio `[LOCAL-FIRST]` frente a Servicios SaaS en la Nube

| Capacidad | Tornio (`v3.0.0`) | Suites SaaS Tradicionales |
| :--- | :--- | :--- |
| **Residencia de Datos** | `100%` en `127.0.0.1` (archivos nunca salen del PC) | Subidos a servidores externos de terceros |
| **Cuotas y Límites** | `500 MB` por archivo / `2 GB` en unión, uso ilimitado | Límites diarios, topes de peso y marcas de agua |
| **Dependencia de Red** | Los estudios principales operan sin conexión | Requiere conexión permanente a Internet |
| **Cobertura Funcional** | `7` Studios integrados (`58` herramientas) y flujos | Suscripciones separadas para PDF, video, audio e IA |
| **Auditabilidad** | Código abierto (`Apache 2.0`) + manifiesto `SHA256SUMS.txt` | Procesamiento opaco en servidor remoto |

---

## Arranque Rápido desde el Código Fuente

Requisitos: **Python 3.12+**, **Node.js 20 LTS** y (solo para compilar el instalador) **Inno Setup 6**.

```powershell
git clone https://github.com/albert-dilas/Tornio.git
cd Tornio

# 1. Instalar dependencias de frontend y generar bundle estático
npm --prefix frontend ci
npm --prefix frontend run build

# 2. Preparar entorno virtual de backend
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -r requirements-dev.txt
cd ..

# 3. Iniciar servidor local en http://127.0.0.1:8000
.\backend\.venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Para ejecutar pruebas y compilar binarios Windows, consulta [BUILD_GUIDE.md](BUILD_GUIDE.md).

---

## Índice de Documentación

- [ARCHITECTURE.md](ARCHITECTURE.md) — Topología del sistema, aislamiento en `127.0.0.1`, protección Anti-SSRF `safe_public_get` y FSM
- [ROADMAP.md](ROADMAP.md) — Hitos publicados en `v3.0.0`, novedades previstas para `v3.1.x` y visión a futuro
- [BUILD_GUIDE.md](BUILD_GUIDE.md) — Configuración local, pruebas y pipeline completo PyInstaller + Inno Setup
- [CHANGELOG.md](CHANGELOG.md) — Registro histórico de cambios de `v2.2.0` y `v3.0.0`
- [CONTRIBUTING.md](CONTRIBUTING.md) — Reglas de ingeniería, política cero emojis y checklist de PR
- [SECURITY.md](SECURITY.md) — Política de seguridad y reporte responsable de vulnerabilidades
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — Código de conducta

---

## Licencia y Gobernanza Legal

El código original de Tornio se distribuye bajo la licencia **Apache License, Version 2.0** ([LICENSE](LICENSE) y [NOTICE](NOTICE)).

**Aviso de Distribución Binaria Combinada**: Los ejecutables compilados para Windows (`Tornio.exe` y `Tornio_Setup_v3.0.0.exe`) incluyen las librerías `PyMuPDF` (`fitz`) y `pymupdf4llm`, licenciadas bajo **GNU AGPL v3.0**. En estricto cumplimiento de dicha licencia, el código fuente correspondiente completo y el inventario detallado de dependencias de terceros se encuentran publicados de forma abierta en este repositorio y en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Los motores opcionales (`Tesseract OCR`, `FFmpeg`, `LibreOffice`, `yt-dlp`) se mantienen externos y gestionados por el usuario.

---

## Apoyo al Proyecto

Tornio es software libre y gratuito sin publicidad, muros de pago ni telemetría. Si resulta útil para tu trabajo diario o protege documentos confidenciales de tu equipo, puedes apoyar su mantenimiento continuo mediante [GitHub Sponsors](https://github.com/sponsors/albert-dilas) o compartir sugerencias en [GitHub Discussions](https://github.com/albert-dilas/Tornio/discussions).
