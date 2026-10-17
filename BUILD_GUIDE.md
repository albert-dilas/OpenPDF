# Guía de Compilación de OpenPDF

Este documento detalla el procedimiento exacto para reconstruir el ejecutable autónomo (`OpenPDF.exe`) y el instalador oficial de Windows (`OpenPDF_Setup_v2.0.0.exe`) desde el código fuente.

## Prerrequisitos del Entorno

1. **Sistema Operativo:** Windows 10/11 (o entorno de integración continua Windows).
2. **Node.js:** v18 o v20+.
3. **Python:** v3.12+.
4. **Inno Setup:** v6 (necesario para generar el instalador final).

## 1. Configuración Inicial del Entorno

Asegúrate de instalar las dependencias tanto del backend como del frontend:

```powershell
# 1. Clonar el repositorio y entrar
git clone https://github.com/albert-dilas/OpenPDF.git
cd OpenPDF

# 2. Instalar dependencias del frontend
cd frontend
npm install
cd ..

# 3. Crear entorno virtual del backend e instalar dependencias
cd backend
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements-dev.txt
pip install pyinstaller  # Necesario para empaquetar el ejecutable
cd ..
```

## 2. Preparación de Assets del Instalador (Opcional)

Si el ícono o los banners del instalador han cambiado, regénéralos con Pillow:

```powershell
python scripts/prepare_assets.py
```

## 3. Ejecutar el Pipeline de Compilación

Ejecuta en orden los dos scripts de empaquetado desde la raíz del proyecto:

```powershell
# Paso 1: Compila el frontend estático (frontend/out) y empaqueta OpenPDF.exe con PyInstaller
python scripts/build_exe.py

# Paso 2: Empaqueta el instalador de Windows con Inno Setup (ISCC.exe)
python scripts/build_installer.py
```

### ¿Qué hacen internamente estos scripts?
1. **Frontend (`npm run build`):** Genera el export estático en `frontend/out` con fuentes locales e iconos embebidos (100% offline).
2. **Backend (`installer/OpenPDF.spec`):**
   - Empaqueta el servidor FastAPI + PyMuPDF + pdf2docx + pytesseract.
   - Incluye explícitamente `python_multipart` y los módulos necesarios en `hiddenimports`.
   - Incrusta `frontend/out` dentro del binario monolítico.
3. **Instalador (`installer/OpenPDF_Installer.iss`):** Invoca Inno Setup para generar el asistente de instalación final.

## 4. Artefactos de Salida

Tras la compilación encontrarás los artefactos en el directorio `/dist`:

* `OpenPDF.exe`: Binario portátil autónomo.
* `OpenPDF_Setup_v2.0.0.exe`: Instalador oficial distribuible en GitHub Releases.
