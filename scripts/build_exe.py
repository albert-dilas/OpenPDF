"""
Compila el frontend estático (Next.js) y empaqueta el ejecutable monolítico OpenPDF.exe en dist/OpenPDF.exe.
"""
import os
import subprocess
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
INSTALLER_DIR = os.path.join(PROJECT_ROOT, "installer")
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")
BUILD_DIR = os.path.join(PROJECT_ROOT, "build")
SPEC_FILE = os.path.join(INSTALLER_DIR, "OpenPDF.spec")


def get_python_executable() -> str:
    venv_py = os.path.join(BACKEND_DIR, ".venv", "Scripts", "python.exe")
    if os.path.exists(venv_py):
        return venv_py
    venv_py_alt = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
    if os.path.exists(venv_py_alt):
        return venv_py_alt
    return sys.executable


def main() -> None:
    py_exe = get_python_executable()
    print("============================================================")
    print("  OpenPDF v2.0.0 - Compilacion de Ejecutable Monolitico")
    print(f"  Python: {py_exe}")
    print("============================================================")

    print("\n[1/4] Preparando iconos y recursos del instalador...")
    subprocess.run([py_exe, os.path.join(PROJECT_ROOT, "scripts", "prepare_assets.py")], check=True)

    print("\n[2/4] Compilando Frontend estatico (Next.js)...")
    subprocess.run(["npm", "run", "build"], cwd=FRONTEND_DIR, shell=True, check=True)

    print("\n[3/4] Verificando PyInstaller en el entorno...")
    subprocess.run(
        [py_exe, "-m", "pip", "install", "-q", "--disable-pip-version-check", "pyinstaller"],
        check=True,
    )

    print("\n[4/4] Empaquetando Backend + Frontend con PyInstaller...")
    pyinstaller_cmd = [
        py_exe,
        "-m",
        "PyInstaller",
        "--clean",
        "--noconfirm",
        "--distpath",
        DIST_DIR,
        "--workpath",
        BUILD_DIR,
        SPEC_FILE,
    ]
    subprocess.run(pyinstaller_cmd, cwd=PROJECT_ROOT, check=True)

    exe_path = os.path.join(DIST_DIR, "OpenPDF.exe")
    size_mb = os.path.getsize(exe_path) / (1024 * 1024)
    print(f"\n[OK] Ejecutable generado exitosamente ({size_mb:.1f} MB): {exe_path}")


if __name__ == "__main__":
    main()
