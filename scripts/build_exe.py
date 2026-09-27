import os
import subprocess
import sys

# Mover el directorio de trabajo a la raíz del proyecto
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(PROJECT_ROOT)

print("==================================")
print(" Construyendo OpenPDF Monolítico ")
print("==================================")

# 1. Construir Frontend
print("\\n1. Compilando Frontend (Next.js)...")
os.chdir("frontend")
subprocess.run(["npm", "run", "build"], shell=True)
os.chdir("..")

# 2. Empaquetar con PyInstaller
print("\\n2. Empaquetando Backend + Frontend con PyInstaller...")
os.chdir("backend")
# Instalamos pyinstaller si no está
subprocess.run(["pip", "install", "pyinstaller"], shell=True)

# PyInstaller command: 
# Incluye la carpeta frontend/out dentro del ejecutable en la ruta 'frontend/out'
pyinstaller_cmd = [
    "python", "-m", "PyInstaller",
    "--name=OpenPDF",
    "--onefile",
    "--windowed", # No muestra consola negra en background
    "--add-data=../frontend/out;frontend/out",
    "app/main.py"
]
subprocess.run(pyinstaller_cmd, shell=True)

print("\\n¡Construcción terminada! El ejecutable está en backend/dist/OpenPDF.exe")
