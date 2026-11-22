# Tornio (OpenPDF) - Reglas Obligatorias de Ingenieria, Seguridad en la Nube y Despliegue (Always-On)

Estas reglas son de cumplimiento estricto e incondicional para cualquier agente de IA que modifique, audite, empaquete o despliegue este repositorio. Ninguna tarea de lanzamiento se considera terminada hasta haber ejecutado todos los pasos aplicables de esta guia.

---

## 1. Principios Innegociables del Proyecto

1. **Arquitectura `[LOCAL-FIRST]`**:
   - Todo el procesamiento documental y multimedia debe ejecutarse 100% en local (`127.0.0.1`) sin enviar archivos ni metadatos a servicios externos.
   - Cualquier modulo que consulte la red (como `/api/v1/system/updates`) debe tener *timeout* corto (`<= 3s`), cache local y *fallback* silencioso (`200 OK` con `online: false`) cuando no haya conexion.
   - Toda utilidad bajo el dominio Web/Online debe utilizar validacion Anti-SSRF salto a salto (`safe_public_get`), bloqueando IPs privadas, loopback, link-local y metadatos cloud.
   - El frontend estatico (`frontend/out`) debe funcionar 100% offline (tipografias e iconos locales embebidos, sin CDNs obligatorios en la aplicacion de escritorio).
2. **Cero Emojis y Cero Cliches de IA (Estetica de Ingenieria de Sistemas)**:
   - Esta estrictamente prohibido incluir emojis o pictogramas Unicode (`\U0001F300-\U0001FAFF`, `\u2600-\u27BF`) en archivos de documentacion (`README.md`, `BUILD_GUIDE.md`, `ROADMAP.md`), fanpage (`docs/index.html`), codigo fuente (`frontend/`, `backend/`), notificaciones `toast`, notas de Release o textos del instalador (`installer/`).
   - Utiliza exclusivamente iconos vectoriales SVG (`lucide-react` / `ToolIcon.tsx` en la app o SVG inline en `docs/index.html`) y redaccion tecnica sobria, libre de etiquetas promocionales o lenguaje generico de IA.
3. **Estandares de Frontend y Design System**:
   - **Minimalismo real y teoria del color (60-30-10)**: jerarquia limpia, sin duplicacion de herramientas entre Home Launchpad (`/`) y rutas de Studio (`/studios/[studio]`).
   - **Maquinas de Estados Finitos (`fsm.ts`)**: prohibido usar booleanos simples (`isLoading`, `loading`, `checking`). Todo flujo asincrono debe modelar explicitamente `idle`, `loading`, `revalidating`, `fetchingNextPage`, `optimistic`, `empty`, `ready`, `paused`, `offline`, `aborted`, `error` con sus primitivas visuales (`Loaders.tsx`, `TopProgressBar.tsx`).
   - **Verificacion en navegador real**: todo cambio visual o de frontend debe verificarse en vivo (`0` errores de consola, `0` peticiones fallidas `>= 400`).

---

## 2. Matriz de Propagacion Obligatoria ante Cambios

Cada vez que se modifique el proyecto, evalua que capas fueron afectadas y ejecuta **obligatoriamente** las actualizaciones derivadas antes de publicar:

| Capa Modificada | Acciones Obligatorias |
| :--- | :--- |
| **Backend (`backend/`)** | 1. Anadir/actualizar tests en `backend/tests/`.<br>2. Ejecutar `.\backend\.venv\Scripts\python -m pytest -q` (0 fallos).<br>3. Recompilar el ejecutable e instalador si el cambio afecta produccion. |
| **Frontend (`frontend/`)** | 1. Ejecutar `npm --prefix frontend run lint` y `npx --prefix frontend tsc -p frontend/tsconfig.json --noEmit` (0 errores).<br>2. Ejecutar `npm --prefix frontend run build` para regenerar `frontend/out`.<br>3. Verificar en navegador real (`0` errores en consola). |
| **UI/UX, Identidad Visual o Catalogo de Studios** | 1. Regenerar iconos y activos del instalador con `.\backend\.venv\Scripts\python scripts/prepare_assets.py`.<br>2. Con el servidor local corriendo, regenerar las capturas reales (`banner.png`, `overview.jpg`, `tools.jpg`, `workflow.jpg`) usando Playwright y guardarlas tanto en `assets/` como en `docs/assets/`.<br>3. Actualizar `README.md` y la fanpage `docs/index.html` (`https://albert-dilas.github.io/Tornio/`). |
| **Nueva Version, Modulos o Instalador (`installer/`, `scripts/`)** | 1. Sincronizar el numero de version SemVer (`X.Y.Z`) en toda la Matriz de Versionado (Seccion 3).<br>2. Verificar que `installer/*.iss` sincronice las preferencias iniciales en `%LOCALAPPDATA%\Tornio\config.json` (`desktop`: `keep_in_background`, `start_with_windows`, `context_menu_enabled`, `update_mode`).<br>3. Ejecutar `.\backend\.venv\Scripts\python scripts/build_installer.py` para generar los binarios y `dist/SHA256SUMS.txt`.<br>4. Verificar mediante *smoke test* que el `.exe` compilado responde `200 OK` en `/api/v1/system/status`. |

---

## 3. Gobernanza Legal, Versiones y Contrato de Auto-Actualizacion (Single Source of Truth)

Antes de etiquetar o subir una nueva version `vX.Y.Z` a la nube, verifica que la gobernanza legal (`Apache License 2.0` + `NOTICE` + `THIRD_PARTY_NOTICES.md` con declaracion transparente de `PyMuPDF` `AGPL-3.0`), el numero de version, el nombre del producto y las URLs de descarga coincidan exactamente en todos estos puntos:

1. `backend/app/core/config.py` (`PROJECT_NAME`, `VERSION = "X.Y.Z"`)
2. `frontend/package.json` (`"version": "X.Y.Z"`)
3. `installer/version_info.txt` (codificacion UTF-8, `FileVersion`, `ProductVersion`, `ProductName = "Tornio"`, `OriginalFilename = "Tornio.exe"`, `Apache License 2.0`)
4. `installer/*.spec`, `installer/*.iss` y `installer/assets/LICENSE.txt` (`#define AppVersion "X.Y.Z"`, nombres de salida en `dist/`, sincronizacion de preferencias en `config.json`)
5. `scripts/build_exe.py` y `scripts/build_installer.py` (incluyendo generacion de `dist/SHA256SUMS.txt`)
6. `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`
7. `README.md` (insignias de version, enlaces de descarga directa a `/releases/download/vX.Y.Z/...`, conteo de Studios/herramientas, licencia Apache 2.0)
8. `docs/index.html` (Fanpage: badge de version actual, botones CTA de descarga directa al instalador y portable de `vX.Y.Z`, metadatos OpenGraph/SEO y notas de version)

---

## 4. Protocolo de Subida Segura a la Nube (GitHub Security & Cloud Hygiene)

### 4.1. Auditoria de Seguridad Pre-Commit (Obligatoria)
Nunca ejecutes `git add` o `git push` sin validar primero:
1. **Cero Secretos y Credenciales**:
   - Jamas incluir tokens (`gh auth token`, `GITHUB_TOKEN`, API keys), cabeceras de autorizacion ni rutas privadas en archivos del repositorio o en `.git/config`.
2. **Higiene de Archivos y Peso del Repositorio**:
   - Comprobar con `git status -s` que no se rastreen directorios temporales o pesados: `temp_files/`, `dist/`, `build/`, `.venv/`, `node_modules/`, `__pycache__/`, modelos locales (`.onnx`, `.bin`) ni binarios descargables (`ffmpeg.exe`, `yt-dlp.exe`).
   - Los binarios compilados (`.exe`) **solo** se suben como activos de **GitHub Releases**, nunca dentro del arbol Git.
3. **Escaneo Automatizado de Cero Emojis**:
   - Ejecutar un escaneo sobre todos los archivos rastreados por Git (`git ls-files`) para confirmar `0` coincidencias de rangos Unicode de emojis antes de crear el commit.

### 4.2. Commit y Push No Interactivo a `main`
1. Usar formato **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `release:`).
2. **Prevencion de Bloqueos por Dialogos Interactivos en Windows**:
   - Configurar siempre: `$env:GIT_TERMINAL_PROMPT="0"; $env:GCM_INTERACTIVE="never"`.
   - Autenticar el push en memoria usando la sesion activa de GitHub CLI (`gh auth status`) y limpiar las variables inmediatamente despues:
     ```powershell
     $env:GIT_TERMINAL_PROMPT="0"
     $env:GCM_INTERACTIVE="never"
     $token = (gh auth token).Trim()
     $b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
     git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $b64" push origin main --follow-tags
     Remove-Variable token, b64 -ErrorAction SilentlyContinue
     ```
   - Si no hay sesion activa en `gh`, solicitar autorizacion o token temporal al usuario; nunca dejar un push colgado ni guardar tokens en disco.

---

## 5. Estandares de Publicacion en GitHub (Metadatos, Tags, Releases e Imagenes)

Cada lanzamiento o actualizacion mayor debe dejar el repositorio de GitHub con calidad de portafolio profesional:

1. **Metadatos, Descripcion y Topics del Repositorio (`gh repo edit`)**:
   - Mantener actualizada la descripcion oficial del repositorio, el sitio web (`https://albert-dilas.github.io/Tornio/`) y las etiquetas (*topics*) de descubrimiento con `gh repo edit`:
     - Topics base requeridos: `local-first`, `desktop-app`, `windows`, `fastapi`, `nextjs`, `typescript`, `python`, `pdf-tools`, `video-processing`, `audio-processing`, `image-processing`, `offline-ai`, `media-workbench`.
2. **Imagenes y Capturas Reales (`assets/` y `docs/assets/`)**:
   - Prohibido usar capturas desactualizadas o mockups ficticios.
   - Todas las imagenes (`banner.png`, `overview.jpg`, `tools.jpg`, `workflow.jpg` y capturas de Studios) deben generarse con Playwright desde la interfaz real compilada, con resolucion nitida, sin errores en pantalla y sincronizadas identicamente entre `assets/` y `docs/assets/`.
3. **Etiquetado Git (`git tag`), Manifiesto `SHA256SUMS.txt` y GitHub Releases (`gh release`)**:
   - Crear etiqueta anotada para cada version: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`.
   - Compilar y validar por *smoke test* tanto el instalador (`Tornio_Setup_vX.Y.Z.exe`) como el ejecutable portable (`Tornio.exe`).
   - **Contrato Obligatorio de Auto-Actualizacion**: generar y subir **siempre** `dist/SHA256SUMS.txt` (formato `<sha256_hex>  <filename>`) como activo adjunto en cada GitHub Release junto a `Tornio_Setup_vX.Y.Z.exe` y `Tornio.exe`. El auto-actualizador integrado en la app descarga desde hosts oficiales GitHub HTTPS y verifica criptograficamente el binario contra `SHA256SUMS.txt` antes de ejecutarlo; si falta `SHA256SUMS.txt`, las actualizaciones automaticas fallaran por seguridad.
   - Publicar o actualizar la Release con `gh release create vX.Y.Z` / `gh release upload vX.Y.Z --clobber` incluyendo notas de version estructuradas:
     - Resumen de arquitectura y novedades de la version.
     - Desglose de Studios / herramientas anadidas o mejoradas.
     - Tabla de integridad `SHA-256` con nombre exacto de archivo, tamano en MB y hash completo.
     - Instrucciones claras de instalacion (`Setup` vs `Portable`).

---

## 6. Gobernanza y Arquitectura de la Fanpage Oficial (`docs/index.html` - GitHub Pages)

La fanpage publica se sirve desde la rama `main` carpeta `/docs` en `https://albert-dilas.github.io/Tornio/` y es el punto de aterrizaje principal para trafico de redes sociales y portafolio:

1. **Identidad Visual: App Design System + Escenografia 3D Interactiva**:
   - Mantener coherencia estética con la aplicacion web (minimalismo editorial, teoria del color 60-30-10, acento bermellon `#E04826`, paletas analogas por Studio y cero emojis / cero cliches de IA), elevada con **escenografia 3D interactiva y animaciones fluidas** (perspectiva CSS 3D con seguimiento de cursor, vista explotada de capas de arquitectura, esculturas 3D por Studio y orbe iridiscente).
   - **Adaptacion Automatica al Sistema (Claro / Oscuro) + Selector Manual**:
     - Detectar automaticamente `prefers-color-scheme: dark | light` desde el `<head>` (sin parpadeo inicial / FOUC) aplicando los tokens reales de la app (`Porcelain Light #FAF9F7` y `Carbon Dark #0C0C0E`), incluyendo adaptacion de sombras volumetricas, brillos especulares y superficies 3D, mas un conmutador manual (Claro / Oscuro / Sistema) e idioma (ES / EN).
2. **Ingenieria de Retencion y Conversion (Cero Fuga de Usuarios)**:
   - **Hero 3D Interactivo Above-the-Fold**: CTA primario de descarga directa (`Instalador Windows x64` + selector `Ejecutable Portable .exe`), tamano, version `vX.Y.Z`, badge de verificacion `SHA-256` y simulador interactivo donde el visitante puede alternar entre los 7 Studios dentro del escenario 3D.
   - **Sticky Conversion Dock**: barra flotante discreta que aparece al hacer scroll fuera del Hero, manteniendo la descarga a 1 clic en todo momento.
   - **Explorador Interactivo de Studios y Comparativa Local-First**: buscador/filtro en vivo del catalogo completo de herramientas, demostracion interactiva de flujos (Pipelines, Waveform, Antes/Despues) y comparativa directa `Tornio [LOCAL-FIRST]` vs plataformas Cloud SaaS.
3. **Arquitectura Modular Guiada por Datos (Lista para Actualizar y Expandir)**:
   - Estructurar `docs/index.html` con un registro declarativo centralizado (`TORNIO_SITE_CONFIG`) al inicio del script para poder anadir o modificar en segundos:
     - Datos de la version actual (`version`, fecha, URLs de descarga de GitHub Releases, tamanos en MB, hashes `SHA-256`).
     - **Feed de Actualizaciones / Changelog & Avisos**: linea de tiempo y tarjetas de novedades para reportar actualizaciones, parches y anuncios a usuarios que llegan desde redes sociales.
     - Catalogo de Studios/herramientas y bloques modulares extensibles (benchmarks, preguntas frecuentes, seguridad, hoja de ruta).
4. **SEO, OpenGraph para Redes Sociales y Verificacion Post-Despliegue**:
   - Metadatos completos (`<title>`, `description`, `og:title`, `og:description`, `og:image`, `twitter:card`) apuntando a `assets/banner.png` y rutas relativas limpias (`assets/...`) dentro de `docs/assets/`.
   - Tras hacer push a `main`, verificar con `gh api repos/albert-dilas/Tornio/pages/builds/latest` que el despliegue de GitHub Pages finalice en `status: "built"`.
