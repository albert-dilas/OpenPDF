---
trigger: always_on
description: Reglas obligatorias de ciclo de vida, compilación de ejecutables, actualización web y despliegue en GitHub para OpenPDF.
---

# Regla Always-On de Ciclo de Vida OpenPDF

Antes de dar por finalizada cualquier solicitud de cambio en este workspace, lee y aplica todas las directrices de [AGENTS.md](../../AGENTS.md):

1. **Cero Emojis y Estilo Serio**: No utilices emojis en código, interfaz, notificaciones, `README.md`, `docs/index.html` ni instalador.
2. **Arquitectura `[LOCAL-FIRST]`**: Todo el núcleo opera 100% offline en `127.0.0.1`; cualquier consulta externa debe tener fallback silencioso.
3. **Pruebas y Compilación**:
   - Backend: `.\backend\.venv\Scripts\python -m pytest -q`
   - Frontend: `npm --prefix frontend run lint`, `npx --prefix frontend tsc -p frontend/tsconfig.json --noEmit`, `npm --prefix frontend run build`
   - Si cambiaste UI o herramientas: actualiza capturas en `assets/` y `docs/assets/`, `README.md` y la web `docs/index.html`.
   - Si cambiaste código funcional o del instalador: ejecuta `.\backend\.venv\Scripts\python scripts/build_installer.py` para actualizar `dist/OpenPDF.exe` y `dist/OpenPDF_Setup_vX.Y.Z.exe` y realiza smoke test del `.exe`.
4. **Publicación en GitHub**:
   - Haz `git commit` y `git push origin main` (actualiza repositorio y GitHub Pages `albert-dilas.github.io/OpenPDF`).
   - Sube los nuevos `.exe` (`OpenPDF_Setup_vX.Y.Z.exe` y `OpenPDF.exe`) a GitHub Releases.
