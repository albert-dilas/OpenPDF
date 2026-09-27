"""
OpenPDF - Build Master Script
Orquesta el proceso completo de empaquetado:
  1. Compila el frontend Next.js
  2. Empaqueta con PyInstaller -> OpenPDF.exe
  3. Genera el instalador con Inno Setup -> OpenPDF_Setup_v1.0.0.exe
"""
import os
import sys
import subprocess
import shutil
import time

# ─── Colores para consola ─────────────────────────────────────────────────────
def header(msg):
    print("\n" + "=" * 60)
    print(f"  {msg}")
    print("=" * 60)

def step(msg):
    print(f"\n  >> {msg}")

def ok(msg):
    print(f"     [OK] {msg}")

def err(msg):
    print(f"     [ERROR] {msg}")
    sys.exit(1)

# ─── Rutas del proyecto ───────────────────────────────────────────────────────
PROJECT_ROOT  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR  = os.path.join(PROJECT_ROOT, "frontend")
BACKEND_DIR   = os.path.join(PROJECT_ROOT, "backend")
INSTALLER_DIR = os.path.join(PROJECT_ROOT, "installer")
DIST_DIR      = os.path.join(PROJECT_ROOT, "dist")
SPEC_FILE     = os.path.join(INSTALLER_DIR, "OpenPDF.spec")
ISS_FILE      = os.path.join(INSTALLER_DIR, "OpenPDF_Installer.iss")
ISCC_PATH     = r"C:\Users\Albert\AppData\Local\Programs\Inno Setup 6\ISCC.exe"

start_time = time.time()

# =============================================================================
header("PASO 1/3: Compilando Frontend (Next.js)")
# =============================================================================
step("Ejecutando: npm run build")

result = subprocess.run(
    ["npm", "run", "build"],
    cwd=FRONTEND_DIR,
    shell=True,
    capture_output=False
)
if result.returncode != 0:
    err("Fallo la compilacion del frontend. Revisa los errores de npm.")

out_dir = os.path.join(FRONTEND_DIR, "out")
if not os.path.exists(out_dir):
    err(f"No se encontro la carpeta 'out' en: {out_dir}")

ok(f"Frontend compilado exitosamente -> {out_dir}")

# =============================================================================
header("PASO 2/3: Empaquetando con PyInstaller")
# =============================================================================
step("Limpiando builds anteriores...")
build_dir = os.path.join(BACKEND_DIR, "build")
if os.path.exists(build_dir):
    shutil.rmtree(build_dir)
    ok("Carpeta 'build' anterior eliminada")

# Verificar que el icono existe
ico_path = os.path.join(INSTALLER_DIR, "openpdf.ico")
if not os.path.exists(ico_path):
    err(f"Icono no encontrado: {ico_path}\nEjecuta primero: python scripts/prepare_assets.py")

step("Ejecutando PyInstaller con spec mejorado...")
pyinstaller_cmd = [
    sys.executable, "-m", "PyInstaller",
    "--distpath", DIST_DIR,
    "--workpath", os.path.join(PROJECT_ROOT, "build"),
    "--noconfirm",
    SPEC_FILE
]

result = subprocess.run(
    pyinstaller_cmd,
    cwd=PROJECT_ROOT,
    capture_output=False
)
if result.returncode != 0:
    err("PyInstaller fallo. Revisa los errores arriba.")

exe_path = os.path.join(DIST_DIR, "OpenPDF.exe")
if not os.path.exists(exe_path):
    err(f"El ejecutable no fue generado en: {exe_path}")

exe_size_mb = os.path.getsize(exe_path) / (1024 * 1024)
ok(f"OpenPDF.exe generado exitosamente ({exe_size_mb:.1f} MB)")
ok(f"Ubicacion: {exe_path}")

# =============================================================================
header("PASO 3/3: Generando Instalador con Inno Setup")
# =============================================================================
if not os.path.exists(ISCC_PATH):
    err(f"Inno Setup no encontrado en: {ISCC_PATH}")

step("Compilando script .iss con ISCC...")
result = subprocess.run(
    [ISCC_PATH, ISS_FILE],
    cwd=INSTALLER_DIR,
    capture_output=False
)
if result.returncode != 0:
    err("Inno Setup fallo. Revisa los errores arriba.")

# Buscar el instalador generado
installer_path = os.path.join(DIST_DIR, "OpenPDF_Setup_v1.0.0.exe")
if os.path.exists(installer_path):
    installer_size_mb = os.path.getsize(installer_path) / (1024 * 1024)
    ok(f"Instalador generado: {installer_size_mb:.1f} MB")
    ok(f"Ubicacion: {installer_path}")

# =============================================================================
elapsed = time.time() - start_time
header(f"BUILD COMPLETADO en {elapsed:.0f} segundos")
# =============================================================================
print(f"""
  Archivos generados:
  -------------------
  Ejecutable:  {DIST_DIR}\\OpenPDF.exe
  Instalador:  {DIST_DIR}\\OpenPDF_Setup_v1.0.0.exe

  El instalador es el archivo a distribuir.
  Cualquier persona puede hacer doble clic en el para instalar OpenPDF.
""")
