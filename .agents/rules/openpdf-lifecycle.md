---
trigger: always_on
description: Reglas obligatorias de ciclo de vida, seguridad en la nube, versionado, imagenes, GitHub Releases y fanpage para Tornio (OpenPDF).
---

# Regla Always-On de Ciclo de Vida y Despliegue Seguro en la Nube

Antes de dar por finalizada cualquier solicitud de cambio o lanzamiento en este workspace, lee y aplica todas las directrices de [AGENTS.md](../../AGENTS.md):

1. **Cero Emojis, Cero Cliches de IA y Design System Profesional**:
   - Prohibido usar emojis en codigo, UI, notificaciones, `README.md`, `ROADMAP.md`, `docs/index.html`, notas de Release o instalador.
   - Todo estado asincrono en frontend debe usar Maquinas de Estados Finitos (`fsm.ts`) y primitivas de `Loaders.tsx` (prohibido usar booleanos sueltos como `isLoading`).
   - Verificar siempre la compilacion de frontend en un navegador real (`0` errores de consola, `0` peticiones fallidas `>= 400`).
2. **Arquitectura `[LOCAL-FIRST]`**:
   - Todo el nucleo opera 100% offline en `127.0.0.1`; cualquier consulta externa debe tener timeout `<= 3s` y fallback silencioso; herramientas web usan validacion Anti-SSRF salto a salto (`safe_public_get`).
3. **Pruebas, Compilacion, Gobernanza Legal y Sincronizacion de Version (`vX.Y.Z`)**:
   - Backend: `.\backend\.venv\Scripts\python -m pytest -q` (0 fallos).
   - Frontend: `npm --prefix frontend run lint`, `npx --prefix frontend tsc -p frontend/tsconfig.json --noEmit`, `npm --prefix frontend run build`.
   - Gobernanza Open Source: mantener `LICENSE` (Apache 2.0), `NOTICE`, `THIRD_PARTY_NOTICES.md` (con aviso transparente de `PyMuPDF` bajo `AGPL-3.0`), `SECURITY.md`, `CODE_OF_CONDUCT.md` e `installer/assets/LICENSE.txt` actualizados.
   - Sincronizar version y preferencias desktop del instalador (`%LOCALAPPDATA%\Tornio\config.json` -> bloque `desktop`) en: `backend/app/core/config.py`, `frontend/package.json`, `installer/version_info.txt`, `installer/*.spec`, `installer/*.iss`, `scripts/build_exe.py`, `scripts/build_installer.py`, `README.md` y `docs/index.html`.
   - Si cambiaste código funcional o del instalador: ejecuta `.\backend\.venv\Scripts\python scripts/build_installer.py` y realiza *smoke test* del `.exe` contra `/api/v1/system/status`.
4. **Imagenes Reales y Fanpage (`docs/index.html`)**:
   - Regenerar capturas reales con Playwright (`banner.png`, `overview.jpg`, `tools.jpg`, `workflow.jpg`) y sincronizarlas identicamente en `assets/` y `docs/assets/`.
   - Mantener la fanpage `docs/index.html` sincronizada con la identidad visual de la app, enlaces directos a la ultima Release `vX.Y.Z`, SEO/OpenGraph y rutas relativas limpias (`assets/...`).
5. **Subida Segura a GitHub (Codigo, Metadatos, Tags, Auto-Updater `SHA256SUMS.txt`, Releases y GitHub Pages)**:
   - **Higiene Pre-Push**: verificar con `git status -s` que no se suban secretos, tokens, `temp_files/`, `dist/`, `.venv/`, `node_modules/` ni modelos pesados, y confirmar `0` emojis en archivos rastreados (`git ls-files`).
   - **Push No Interactivo**: usar `$env:GIT_TERMINAL_PROMPT="0"`, `$env:GCM_INTERACTIVE="never"` y token efimero en memoria via `gh auth token` (eliminando las variables con `Remove-Variable` tras el push; nunca guardar tokens en `.git/config`).
   - **Metadatos y Topics**: mantener descripcion, homepage y topics del repositorio al dia con `gh repo edit`.
   - **Tags, Releases y Auto-Actualizador**: etiquetar con `git tag -a vX.Y.Z`, publicar con `gh release create` / `gh release upload --clobber` adjuntando **obligatoriamente** `Tornio_Setup_vX.Y.Z.exe`, `Tornio.exe` y `SHA256SUMS.txt` (usado para verificacion criptografica del auto-actualizador in-app), junto con la tabla de hashes `SHA-256`, y comprobar el build de GitHub Pages (`gh api repos/albert-dilas/Tornio/pages/builds/latest`).
