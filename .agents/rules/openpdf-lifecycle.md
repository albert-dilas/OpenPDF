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

6. **Lecciones Aprendidas de Verificacion Web, WebGL, Capturas y UX**:
   - **Pruebas en `file:///` y `reduced_motion='reduce'`**: Nunca cargar SVG o imagenes externas relativas sobre `<canvas>` para texturas WebGL (`CanvasTexture`), ya que abrir desde disco (`file:///`) provoca `SecurityError: Tainted canvases may not be loaded`; incrustar los activos criticos WebGL como `data:image/svg+xml;base64,...`. Verificar siempre las animaciones en Playwright tambien con `reduced_motion='reduce'` (frecuente en Windows cuando `SPI_GETCLIENTAREAANIMATION = 0`) e inspeccionar visualmente tiras de fotogramas para confirmar direccion real y fluidez.
   - **DOM vivo en indicadores y temporizadores**: Mantener persistentes en el DOM los indicadores deslizantes (`#views-ink`, `#studio-ink`) en lugar de regenerarlos con `innerHTML`, y no usar `scrollIntoView()` vertical dentro de rotaciones automaticas para no secuestrar el desplazamiento del usuario.
   - **Capturas reales y privacidad**: Nunca simular ventanas con cajas HTML/CSS cuando se solicitan fotos reales; recortar limpiamente los margenes del escritorio, descartar o censurar cualquier captura con rutas privadas del equipo (`C:\Users\<usuario>\...`), y mantener paridad byte a byte entre `assets/` y `docs/assets/`.
   - **Tono, densidad y control de despliegue**: Redaccion natural, amigable y sobria para usuarios de cualquier rubro (detalles tecnicos profundos en bloques colapsables), presentacion minimalista con expansion bajo demanda, Boot Loader breve (`<= 4s`) sin botones de control, y nunca ejecutar `git commit` ni `git push` sin aprobacion explicita del usuario tras revisar la evidencia visual.

7. **Lecciones Aprendidas de Identidad, Redaccion Humana (`human-text-v2`), Redes y Automatizacion**:
   - **Identidad multi-proyecto y activos visuales**: Posicionar los perfiles del autor como ingeniero de software y sistemas de IA multi-proyecto (con `https://github.com/albert-dilas` como nodo central), sin atar la identidad de cuenta a una sola aplicacion. Mantener produccion 100% sin rostro y sin voz, priorizando la portada combinada claro/oscuro (`assets/social_preview.png`) en tarjetas destacadas y publicaciones de Tornio, junto a banners de arquitectura/hardware reales y avatares geometricos originales (evitando disenos 2D roboticos o simbolos similares a marcas existentes).
   - **Redaccion humana obligatoria (`human-text-v2`)**: Aplicar siempre la skill global `human-text-v2` al redactar o editar publicaciones, Devlogs, hilos y guiones: **Nivel 3 (*Colega — Profesional sin humo*)** en GitHub y LinkedIn, y **Nivel 2-3 (*Cafeteria-Colega*)** en X y formato corto. Priorizar prosa continua (>70% sin listas de vinetas tipo folleto), variacion ritmica (*Ley del Acordeon Sintactico*), entrada *in media res* con problemas concretos, tono profesional seguro sin sonar timido ni pretencioso, cero cliches de IA, cero metricas inventadas y cero emojis Unicode.
   - **Separacion de cuentas, higiene en redes y PowerShell Windows**: Mantener estrictamente separada la identidad de desarrollador de cualquier cuenta o correo personal; nunca automatizar comentarios, votos ni *karma farming* en plataformas sociales ni intentar resolver CAPTCHAs. En sesiones de navegador multi-dominio, copiar archivos en `browser_sandbox/uploads/` por dominio en turnos separados porque la carpeta se vacia automaticamente al cambiar de origen. Al ejecutar mutaciones `gh api graphql` en PowerShell Windows, pasar el JSON UTF-8 por `stdin` (`--input -`) para evitar perdida de comillas.
   - **Comportamiento verificado de plataformas**: En Reddit, comunidades como `r/opensource` solo aceptan `TEXT`/`LINK`/`AMA` (sin galeria de imagenes), exigen el flair `Promotional` por Regla 8 y requieren karma previo via AutoModerator; `r/SideProject` acepta `TEXT`/`VIDEO`/`LINK` y sus filtros globales retienen publicaciones con varios enlaces desde cuentas con karma bajo. En Instagram, no etiquetar ni promocionar una cuenta tecnica nueva desde cuentas personales mientras tenga `0` publicaciones para no diluir la senal inicial de audiencia.
