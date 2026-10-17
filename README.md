<div align="center">
  <img src="assets/banner.png" alt="OpenPDF Banner" width="100%">
  <br><br>

  # OpenPDF v2.1

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![CI](https://github.com/albert-dilas/OpenPDF/actions/workflows/ci.yml/badge.svg)](https://github.com/albert-dilas/OpenPDF/actions/workflows/ci.yml)
  [![Architecture](https://img.shields.io/badge/Architecture-Local--First-10b981.svg)](#arquitectura-local-first-offline--online)
  [![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgray.svg)]()
  [![Python version](https://img.shields.io/badge/Python-3.12+-3776ab?logo=python&logoColor=white)](https://www.python.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
  [![Website](https://img.shields.io/badge/Website-Live-success.svg)](https://albert-dilas.github.io/OpenPDF)

  **Plataforma Local-First de código abierto para el procesamiento, conversión, firma, censura, optimización y protección de documentos PDF con privacidad estricta.**
  <br>
  *Ejecución local en el equipo complementada con utilidades Online protegidas contra SSRF.*

</div>

---

## Tabla de Contenidos
- [Descarga e Instalación (Usuarios)](#descarga-e-instalación-usuarios)
- [Descripción General](#descripción-general)
- [Capturas de Pantalla](#capturas-de-pantalla)
- [Catálogo de Herramientas (21 Módulos)](#catálogo-de-herramientas-21-módulos)
- [Arquitectura Local-First (Offline / Online)](#arquitectura-local-first-offline--online)
- [Guía de Desarrollo y Ejecución Local](#guía-de-desarrollo-y-ejecución-local)
- [Compilación y Empaquetado (.exe / Instalador)](#compilación-y-empaquetado-exe--instalador)
- [Pruebas y Calidad](#pruebas-y-calidad)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Descarga e Instalación (Usuarios)

Para instalar y ejecutar **OpenPDF** en Windows sin compilar desde el código fuente:

1. Accede a la sección de [**Releases**](../../releases) de este repositorio.
2. Descarga el instalador oficial de la versión más reciente (`OpenPDF_Setup_v2.1.0.exe`) o el ejecutable portátil autónomo (`OpenPDF.exe`).
3. Ejecuta el instalador y sigue las instrucciones del asistente.

---

## Descripción General

**OpenPDF** es una suite de escritorio y servidor local autoalojable diseñada para organizaciones y profesionales que requieren manipular documentos confidenciales sin exponerlos a servicios en la nube de terceros. Toda la manipulación criptográfica, firma manuscrita, censura irreversible (redacción física), renderizado, compresión, reconocimiento óptico de caracteres (OCR) y conversión documental se ejecuta localmente mediante un motor asíncrono en Python (**FastAPI + PyMuPDF + OpenCV**) acoplado a una interfaz estática compilada en **Next.js 14 + Tailwind CSS**, e incluye además herramientas asistidas por red con validación anti-SSRF.

### Pilares de Ingeniería (v2.1)
- **Privacidad Estricta (`[LOCAL-FIRST]`)**: Los 18 módulos de procesamiento local operan sin conexión alguna; los 3 módulos con acceso a Internet están explícitamente señalizados con la insignia `Online` e incorporan protección anti-SSRF.
- **Ingesta en Streaming con Memoria Constante**: Validación de formato por *magic bytes* en cabecera y escritura en disco por bloques de `1 MiB`, con recolección y borrado garantizado de archivos temporales.
- **Interfaz Técnica y Accesible**: Búsqueda en tiempo real, clasificación por categorías funcionales, soporte nativo para modo claro y modo oscuro con tipografías locales (*Geist Sans* y *Geist Mono*) 100% offline, barra de progreso por fases con cancelación activa (`AbortController`) y diagnóstico del motor local en vivo.

---

## Capturas de Pantalla

<div align="center">
  <img src="assets/overview.jpg" alt="Panel Principal de OpenPDF" width="100%">
  <br>
  <em>Figura 1: Panel principal con indicador de estado del motor local, buscador en tiempo real y filtrado por categorías.</em>
</div>
<br>
<div align="center">
  <img src="assets/tools.jpg" alt="Suite Completa de Herramientas en Modo Oscuro" width="100%">
  <br>
  <em>Figura 2: Catálogo de los 21 módulos de procesamiento PDF en modo oscuro.</em>
</div>
<br>
<div align="center">
  <img src="assets/workflow.jpg" alt="Flujo Interactivo de Organización de Páginas" width="100%">
  <br>
  <em>Figura 3: Espacio de trabajo interactivo para organizar páginas con miniaturas en tiempo real, rotación individual y reordenamiento.</em>
</div>

---

## Catálogo de Herramientas (21 Módulos)

| Categoría | Herramienta | Ruta / Endpoint | Descripción Técnica | Ejecución |
| :--- | :--- | :--- | :--- | :---: |
| **Organizar** | **Unir PDF** | `/merge-pdf` (`POST /api/v1/merge/`) | Combina múltiples documentos PDF en el orden especificado mediante *drag & drop*. | 100% Offline |
| **Organizar** | **Dividir PDF** | `/split-pdf` (`POST /api/v1/split/`) | Extrae todas las páginas o rangos definidos (`1,3-5,7`) en un archivo comprimido `.zip`. | 100% Offline |
| **Organizar** | **Organizar PDF** | `/organize-pdf` (`POST /api/v1/organize/`) | Previsualiza miniaturas por página para reordenar, rotar en incrementos de `90°` y descartar páginas. | 100% Offline |
| **Organizar** | **Rotar PDF** | `/rotate-pdf` (`POST /api/v1/rotate/`) | Aplica rotación uniforme (`90°`, `180°` o `270°`) sobre la totalidad del documento. | 100% Offline |
| **Optimizar** | **Comprimir PDF** | `/compress-pdf` (`POST /api/v1/compress/`) | Compresión en tres niveles (`low`, `medium`, `high` con *downsampling* de imágenes) y reporte de reducción. | 100% Offline |
| **Optimizar** | **OCR PDF** | `/ocr-pdf` (`POST /api/v1/ocr/`) | Genera una capa de texto seleccionable y buscable sobre documentos escaneados vía Tesseract OCR local. | 100% Offline* |
| **Convertir** | **PDF a Word** | `/pdf-to-word` (`POST /api/v1/pdf-to-word/`) | Reconstruye diseño, tablas y párrafos en un archivo editable `.docx` (`pdf2docx`). | 100% Offline |
| **Convertir** | **Word a PDF** | `/word-to-pdf` (`POST /api/v1/word-to-pdf/`) | Convierte documentos `.doc`/`.docx` a estándar PDF mediante LibreOffice en modo *headless*. | 100% Offline* |
| **Convertir** | **JPG a PDF** | `/jpg-to-pdf` (`POST /api/v1/jpg-to-pdf/`) | Ensambla secuencias de imágenes JPG o PNG en un único documento PDF multipágina. | 100% Offline |
| **Convertir** | **PDF a JPG** | `/pdf-to-jpg` (`POST /api/v1/pdf-to-jpg/`) | Rasteriza cada página del documento como imagen JPG de alta resolución empaquetada en `.zip`. | 100% Offline |
| **Convertir** | **PDF a Markdown** | `/pdf-to-markdown` (`POST /api/v1/pdf-to-markdown/`) | Extrae contenido estructurado en formato Markdown (`.md`) orientado a pipelines RAG y LLMs. | 100% Offline |
| **Convertir** | **Web / URL a PDF** | `/url-to-pdf` (`POST /api/v1/url-to-pdf/`) | Captura artículos y páginas web públicas por URL (modo lectura o completo) con protección anti-SSRF. | Online |
| **Convertir** | **Traducir PDF** | `/translate-pdf` (`POST /api/v1/translate/`) | Traduce los bloques de texto del PDF a múltiples idiomas generando un PDF maquetado o bilingüe. | Online |
| **Editar** | **Marca de Agua** | `/watermark-pdf` (`POST /api/v1/watermark/`) | Superpone texto diagonal semitransparente centrado en todas las páginas del documento. | 100% Offline |
| **Editar** | **Números de Página** | `/page-numbers-pdf` (`POST /api/v1/page-numbers/`) | Inserta numeración secuencial `Página X de Y` en el margen inferior del documento. | 100% Offline |
| **Editar** | **Editar Metadatos** | `/metadata-pdf` (`POST /api/v1/metadata/`) | Inspecciona, modifica o limpia los atributos estándar (`Título`, `Autor`, `Asunto`, `Palabras clave`). | 100% Offline |
| **Editar** | **Código QR Web** | `/qr-pdf` (`POST /api/v1/qr/{stamp,inspect}`) | Estampa códigos QR verificando en línea la URL destino o escanea y audita los códigos QR del PDF. | Online / Local |
| **Seguridad** | **Firmar / Sellar PDF** | `/sign-pdf` (`POST /api/v1/sign/`) | Permite dibujar firma manuscrita en pantalla o cargar imagen PNG/JPG de sello con pie de firma. | 100% Offline |
| **Seguridad** | **Censurar / Redactar** | `/redact-pdf` (`POST /api/v1/redact/`) | Purga física e irreversiblemente textos confidenciales, correos, teléfonos, identificadores y URLs. | 100% Offline |
| **Seguridad** | **Proteger PDF** | `/protect-pdf` (`POST /api/v1/protect/`) | Cifra documentos bajo estándar **AES-256** con clave de apertura y permisos. | 100% Offline |
| **Seguridad** | **Desbloquear PDF** | `/unlock-pdf` (`POST /api/v1/unlock/`) | Elimina el cifrado y las restricciones de acceso de un PDF autenticado mediante su contraseña. | 100% Offline |

> \* *Dependencias opcionales del sistema*: **OCR PDF** utiliza **Tesseract OCR** y **Word a PDF** utiliza **LibreOffice** (detectados automáticamente en el `PATH` del sistema, rutas estándar de instalación o el directorio portátil `backend/bin/`). Si no se encuentran en el equipo, el endpoint `GET /api/v1/system/status` lo notifica en la interfaz sin afectar al resto de los módulos.

---

## Arquitectura Local-First (Offline / Online)

```mermaid
flowchart TD
    subgraph Client ["Capa de Presentación (Next.js 14 Static Export + Zustand)"]
        UI["Interfaz React / Tailwind (Modo Claro/Oscuro + Fuentes Locales)"]
        Hook["useToolProcessor (Streaming Progress + AbortController)"]
        SysStore["useSystemStore (Diagnóstico Local + Verificación de Versión)"]
        UI --> Hook
        UI --> SysStore
    end

    subgraph Server ["Motor de Procesamiento Local (FastAPI + Uvicorn en 127.0.0.1)"]
        API["Router REST /api/v1/*"]
        TempMgr["TempFileManager (Streaming 1 MiB + Magic Bytes + Auto-Cleanup)"]
        
        subgraph CoreServices ["Servicios de Dominio (100% Offline)"]
            Fitz["PyMuPDF (Merge, Split, Organize, Sign, Redact, Compress, Metadata, AES-256)"]
            Docx["pdf2docx & pymupdf4llm (PDF a Word / Markdown)"]
            Bins["Binarios Locales Opcionales (Tesseract OCR / LibreOffice)"]
        end

        subgraph OnlineModule ["Módulos de Red Opcionales (SSRF Guard + Fallback)"]
            Upd["GET /api/v1/system/updates (Timeout 3s + Caché 6h + Fallback Silencioso)"]
            NetTools["URL a PDF / Traducir PDF / Verificador QR Web (Protección Anti-SSRF)"]
        end

        API --> TempMgr
        API --> CoreServices
        API --> OnlineModule
    end

    Hook -- "Multipart FormData / Blob (localhost)" --> API
    SysStore -- "GET /system/status & /system/updates" --> API
    Upd -. "HTTPS (Solo lectura de versión; nunca bloqueante)" .-> GH["GitHub Releases API"]
```

### Garantías de Operación Offline y Resiliencia
1. **Autonomía Offline en el Núcleo**: Las fuentes tipográficas, hojas de estilo, iconos y lógica de interfaz se sirven íntegramente desde el paquete estático local.
2. **Verificación de Actualizaciones con *Fallback* Silencioso**: El endpoint `GET /api/v1/system/updates` realiza una consulta externa hacia GitHub Releases (con un tiempo límite estricto de `3 segundos` y almacenamiento en caché de `6 horas`). Si el entorno carece de conexión a internet, devuelve `{ "online": false, "update_available": false }` con estado HTTP `200 OK` sin interrumpir el flujo de trabajo. Puede deshabilitarse definiendo la variable de entorno `OPENPDF_DISABLE_UPDATE_CHECK=1`.
3. **Asignación Dinámica de Puerto y Endurecimiento de Rutas**: Al iniciarse como ejecutable de escritorio, el servidor selecciona automáticamente el primer puerto disponible en el rango `8000–8010` (o el indicado en `OPENPDF_PORT`) y valida todas las rutas de archivos estáticos mediante `Path.resolve()` para impedir vulnerabilidades de *path traversal*.

---

## Guía de Desarrollo y Ejecución Local

### Requisitos Previos
- **Python 3.12+**
- **Node.js 18+ / 20+**
- *(Opcional)* **Tesseract OCR** y **LibreOffice** instalados en el sistema.

### 1. Iniciar el Servidor Backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements-dev.txt

# Iniciar el servidor en http://127.0.0.1:8000
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Ejecutar o Compilar el Frontend
```powershell
cd frontend
npm install

# Entorno de desarrollo con recarga en caliente (http://localhost:3000)
npm run dev

# Generar exportación estática en frontend/out/ para servirla desde FastAPI
npm run build
```

---

## Compilación y Empaquetado (.exe / Instalador)

El repositorio incluye scripts automatizados para generar tanto el binario autónomo (`OpenPDF.exe`) como el instalador de Windows (`OpenPDF_Setup_v2.1.0.exe`):

```powershell
# 1. Regenerar iconos y banners de alta resolución del instalador (opcional)
python scripts/prepare_assets.py

# 2. Compilar frontend, empaquetar ejecutable PyInstaller y generar instalador Inno Setup
python scripts/build_installer.py
```

Los artefactos compilados se depositan en el directorio `dist/`. Consulta [BUILD_GUIDE.md](BUILD_GUIDE.md) para información detallada sobre el proceso de construcción.

---

## Pruebas y Calidad

```powershell
# Suite de pruebas automatizadas del backend (55+ tests de integración y seguridad)
cd backend
.\.venv\Scripts\python -m pytest -v

# Análisis estático y verificación de tipos del frontend
cd ../frontend
npm run lint
npx tsc --noEmit
```

---

## Contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para revisar las pautas de arquitectura, convenciones de código y proceso de envío de *Pull Requests*.

---

## Licencia

Este proyecto se distribuye bajo los términos de la [Licencia MIT](LICENSE).
