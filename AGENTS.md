# OpenPDF - Reglas Obligatorias de Ingeniería y Despliegue (Always-On)

Estas reglas son de cumplimiento estricto e incondicional para cualquier agente de IA que modifique, audite o amplíe el repositorio **OpenPDF**. Ninguna tarea se considera terminada hasta haber ejecutado todos los pasos aplicables de esta guía.

## 1. Principios Innegociables del Proyecto

1. **Arquitectura `[LOCAL-FIRST]`**:
   - Todo el procesamiento documental PDF debe ejecutarse 100% en local (`127.0.0.1`) sin enviar archivos ni metadatos a servicios externos.
   - Cualquier módulo que consulte la red (como `/api/v1/system/updates`) debe tener *timeout* corto (`<= 3s`), caché local y *fallback* silencioso (`200 OK` con `online: false`) cuando no haya conexión.
   - El frontend estático (`frontend/out`) debe funcionar 100% offline (tipografías e iconos locales embebidos, sin CDNs obligatorios en la aplicación de escritorio).
2. **Cero Emojis (Estética Corporativa y Técnica)**:
   - Está estrictamente prohibido incluir emojis o pictogramas Unicode (`\U0001F300-\U0001FAFF`, `\u2600-\u27BF`) en archivos de documentación (`README.md`, `BUILD_GUIDE.md`), sitio web (`docs/index.html`), código fuente (`frontend/`, `backend/`), notificaciones `toast` o textos del instalador (`installer/`).
   - Utiliza exclusivamente iconos vectoriales SVG (`lucide-react` en la app o SVG inline en `docs/index.html`) y redacción técnica sobria.

---

## 2. Matriz de Propagación Obligatoria ante Cambios

Cada vez que el usuario solicite un cambio, evalúa qué capas fueron afectadas y ejecuta **obligatoriamente** las actualizaciones derivadas antes de finalizar:

| Si modificas... | Debes actualizar y ejecutar obligatoriamente... |
| :--- | :--- |
| **Backend (`backend/`)** | 1. Añadir/actualizar tests en `backend/tests/`.<br>2. Ejecutar `.\backend\.venv\Scripts\python -m pytest -q` (0 fallos).<br>3. Recompilar `OpenPDF.exe` e instalador si el cambio afecta comportamiento en producción. |
| **Frontend (`frontend/`)** | 1. Ejecutar `npm --prefix frontend run lint` y `npx --prefix frontend tsc -p frontend/tsconfig.json --noEmit` (0 errores).<br>2. Ejecutar `npm --prefix frontend run build` para regenerar `frontend/out`. |
| **UI/UX, Diseño o Catálogo de Herramientas** | 1. Con el servidor local corriendo, regenerar las capturas reales (`overview.jpg`, `tools.jpg`, `workflow.jpg`) usando Playwright y guardarlas tanto en `assets/` como en `docs/assets/`.<br>2. Actualizar `README.md` y la página web pública `docs/index.html` (`https://albert-dilas.github.io/OpenPDF/`) para reflejar las nuevas herramientas o cambios visuales. |
| **Nuevas Versiones, Módulos o Instalador (`installer/`, `scripts/`)** | 1. Sincronizar número de versión en: `backend/app/core/config.py`, `installer/version_info.txt` (UTF-8), `installer/OpenPDF_Installer.iss`, `scripts/build_installer.py`, `README.md` y `docs/index.html`.<br>2. Ejecutar `.\backend\.venv\Scripts\python scripts/build_installer.py` para generar `dist/OpenPDF.exe` y `dist/OpenPDF_Setup_vX.Y.Z.exe`.<br>3. Verificar con un *smoke test* que `dist/OpenPDF.exe` responde en `/api/v1/system/status`. |

---

## 3. Sincronización Obligatoria con GitHub (Código, Web y Releases)

Después de aplicar y verificar cualquier cambio en local, **siempre** debes sincronizar el repositorio remoto en `https://github.com/albert-dilas/OpenPDF`:

1. **Verificación previa de limpieza**:
   - Comprobar que no existan emojis en los archivos seguidos por Git.
   - Comprobar con `git status -s` que no se suban archivos temporales (`temp_files/`, `.venv/`, `node_modules/`).
2. **Commit y Push a `main` (Código + GitHub Pages)**:
   - Ejecutar `git add -A`, crear un commit con formato Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
   - **Prevención de Bloqueos por Diálogos Interactivos en Windows**: Nunca ejecutes `git push` sin variables no interactivas. Git Credential Manager (GCM) puede pausar la consola indefinidamente esperando una interfaz gráfica:
     - Configura siempre: `$env:GIT_TERMINAL_PROMPT="0"; $env:GCM_INTERACTIVE="never"`.
     - Si hay sesión activa en GitHub CLI (`gh auth status`), autentica el push en memoria pasando el token por cabecera sin alterar `.git/config`:
       ```powershell
       $token = (gh auth token).Trim()
       $b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
       git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $b64" push origin main
       Remove-Variable token, b64 -ErrorAction SilentlyContinue
       ```
   - Recordar que `https://albert-dilas.github.io/OpenPDF/` se despliega desde la rama `main` carpeta `/docs`, por lo que `docs/index.html` y `docs/assets/*` deben estar siempre al día en `main`.
3. **Actualización de Binarios (`.exe`) en GitHub Releases**:
   - Siempre que cambie el código de la aplicación (`backend/`, `frontend/`, `installer/`), se debe compilar `dist/OpenPDF.exe` y `dist/OpenPDF_Setup_vX.Y.Z.exe` y subirlos a la Release correspondiente en GitHub Releases (`https://github.com/albert-dilas/OpenPDF/releases`) junto con su tabla de hashes `SHA-256`.
   - Utilizar comandos `gh release create` y `gh release upload --clobber`.
   - Si `git push` o la API de GitHub Releases requieren autenticación y no hay sesión activa en `gh` ni token en variables de entorno, solicita el token temporal al usuario antes de dar por concluida la tarea y nunca guardes el token en archivos del repositorio ni en `.git/config`.
