# Guía de Compilación de OpenPDF

Este documento detalla el procedimiento exacto para reconstruir el artefacto final (`OpenPDF_Setup.exe`) desde el código fuente.

## Prerrequisitos del Entorno

1. **Sistema Operativo:** Windows 10/11 (o entorno de integración continua Windows).
2. **Node.js:** v18 o superior.
3. **Python:** v3.12 o superior.
4. **Inno Setup:** v6 (necesario para generar el instalador final).

## 1. Configuración Inicial del Entorno

Asegúrate de instalar las dependencias tanto del backend como del frontend.

```powershell
# 1. Clonar el repositorio y entrar
git clone https://github.com/openpdf/openpdf.git
cd openpdf

# 2. Instalar dependencias del frontend
cd frontend
npm install
cd ..

# 3. Crear entorno virtual del backend y activarlo (Recomendado)
cd backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
pip install pyinstaller # Necesario para la compilación
cd ..
```

## 2. Preparación de Assets

Si el ícono o los banners del instalador han cambiado, es necesario regenerarlos usando Pillow.

```powershell
python scripts/prepare_assets.py
```
> [!NOTE]
> Esto procesará `icon.jpg` y `banner.jpg` (ubicados en `design/raw_assets/`) y generará los archivos `.ico` y `.bmp` necesarios para el instalador dentro de la carpeta `installer/`.

## 3. Ejecutar el Master Build Pipeline

Hemos orquestado todo el proceso de compilación en un único script.

```powershell
python scripts/build.py
```

### ¿Qué hace `build.py` internamente?
1. **Frontend:** Ejecuta `npm run build` en la carpeta `/frontend`, generando un build estático dentro de `frontend/out`.
2. **Backend:** Invoca `PyInstaller` apuntando a `installer/OpenPDF.spec`.
   - Empaqueta el servidor FastAPI.
   - Aplica tree-shaking ignorando librerías científicas y de UI (`tkinter`, `pandas`, `numpy`, `torch`, etc.) reduciendo dramáticamente el peso.
   - Inyecta la metadata definida en `installer/version_info.txt` y el ícono.
   - Inyecta los archivos del frontend estático (`frontend/out`) dentro del `.exe` monolítico.
3. **Instalador:** Llama al compilador de Inno Setup (`ISCC.exe`) con la configuración de `installer/OpenPDF_Installer.iss` para empaquetar el `.exe`, las licencias y crear el Wizard de instalación final.

## 4. Artefactos de Salida

Tras una compilación exitosa (aprox. 1 a 3 minutos), encontrarás los artefactos en el directorio `/dist` en la raíz del proyecto:

* `OpenPDF.exe`: El binario portátil. (No se distribuye directamente a los usuarios).
* `OpenPDF_Setup_v1.0.0.exe`: **El instalador oficial**. Este es el archivo que se debe distribuir al cliente final, subir a GitHub Releases, o almacenar en S3.

## Solución de Problemas Frecuentes

* **Inno Setup no se encuentra:** El script `build.py` asume que Inno Setup está instalado en `C:\Users\Albert\AppData\Local\Programs\Inno Setup 6\ISCC.exe`. Si tu ruta es diferente, ajusta la constante `ISCC_PATH` en `scripts/build.py`.
* **Faltan librerías en el empaquetado (ImportError al abrir el EXE):** Si agregas una nueva dependencia y PyInstaller no la encuentra, añádela a la lista de `hiddenimports` en el archivo `installer/OpenPDF.spec`.
