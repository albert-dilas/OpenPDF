"""
Tornio v3.0.0 - Master Build Pipeline
Orquesta el proceso completo de empaquetado:
  1. Genera iconos y banners del instalador (prepare_assets.py)
  2. Compila el frontend estatico Next.js (frontend/out)
  3. Empaqueta el ejecutable monolitico con PyInstaller -> dist/Tornio.exe
  4. Genera el instalador oficial con Inno Setup -> dist/Tornio_Setup_v3.0.0.exe
  5. Genera el manifiesto criptografico dist/SHA256SUMS.txt para el auto-actualizador
"""
import hashlib
import os
import shutil
import subprocess
import sys
import time

VERSION = "3.0.0"

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
INSTALLER_DIR = os.path.join(PROJECT_ROOT, "installer")
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")
BUILD_DIR = os.path.join(PROJECT_ROOT, "build")
SPEC_FILE = os.path.join(INSTALLER_DIR, "Tornio.spec")
ISS_FILE = os.path.join(INSTALLER_DIR, "Tornio_Installer.iss")


def get_python_executable() -> str:
    for venv_name in (".venv", "venv"):
        candidate = os.path.join(BACKEND_DIR, venv_name, "Scripts", "python.exe")
        if os.path.exists(candidate):
            return candidate
    return sys.executable


def find_iscc() -> str:
    candidates = [
        r"C:\Users\Albert\AppData\Local\Programs\Inno Setup 6\ISCC.exe",
        r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
        r"C:\Program Files\Inno Setup 6\ISCC.exe",
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    which_iscc = shutil.which("ISCC") or shutil.which("iscc")
    if which_iscc:
        return which_iscc
    raise FileNotFoundError("Inno Setup 6 (ISCC.exe) no fue encontrado en el sistema.")


def compute_sha256(file_path: str) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while True:
            chunk = f.read(1024 * 1024)
            if not chunk:
                break
            hasher.update(chunk)
    return hasher.hexdigest().lower()


def write_sha256sums(file_paths: list[str], output_path: str) -> list[tuple[str, str, float]]:
    records: list[tuple[str, str, float]] = []
    lines: list[str] = []
    for fp in file_paths:
        if os.path.isfile(fp):
            digest = compute_sha256(fp)
            name = os.path.basename(fp)
            size_mb = os.path.getsize(fp) / (1024 * 1024)
            lines.append(f"{digest}  {name}")
            records.append((name, digest, size_mb))
    with open(output_path, "w", encoding="utf-8") as out:
        out.write("\n".join(lines) + "\n")
    return records


def header(msg: str) -> None:
    print("\n" + "=" * 64)
    print(f"  {msg}")
    print("=" * 64)


def step(msg: str) -> None:
    print(f"\n  >> {msg}")


def ok(msg: str) -> None:
    print(f"     [OK] {msg}")


def err(msg: str) -> None:
    print(f"     [ERROR] {msg}")
    sys.exit(1)


def main() -> None:
    start_time = time.time()
    py_exe = get_python_executable()

    header(f"PASO 1/5: Preparando Recursos Graficos del Instalador (v{VERSION})")
    res = subprocess.run([py_exe, os.path.join(PROJECT_ROOT, "scripts", "prepare_assets.py")], cwd=PROJECT_ROOT)
    if res.returncode != 0:
        err("Fallo la generacion de recursos graficos en prepare_assets.py.")

    header("PASO 2/5: Compilando Frontend Estatico (Next.js)")
    out_dir = os.path.join(FRONTEND_DIR, "out")
    step("Ejecutando: npm run build")
    res = subprocess.run(["npm", "run", "build"], cwd=FRONTEND_DIR, shell=True)
    if res.returncode != 0 or not os.path.exists(out_dir):
        err("Fallo la compilacion del frontend estatico.")
    ok(f"Frontend exportado en: {out_dir}")

    header("PASO 3/5: Empaquetando Ejecutable Monolitico con PyInstaller")
    for stale_dir in (BUILD_DIR, os.path.join(BACKEND_DIR, "build")):
        if os.path.exists(stale_dir):
            shutil.rmtree(stale_dir, ignore_errors=True)

    step("Asegurando que PyInstaller este instalado en el entorno...")
    subprocess.run(
        [py_exe, "-m", "pip", "install", "-q", "--disable-pip-version-check", "pyinstaller"],
        check=True,
    )

    step("Ejecutando PyInstaller...")
    pyinstaller_cmd = [
        py_exe,
        "-m",
        "PyInstaller",
        "--distpath",
        DIST_DIR,
        "--workpath",
        BUILD_DIR,
        "--noconfirm",
        SPEC_FILE,
    ]
    res = subprocess.run(pyinstaller_cmd, cwd=PROJECT_ROOT)
    if res.returncode != 0:
        err("PyInstaller fallo durante el empaquetado.")

    exe_path = os.path.join(DIST_DIR, "Tornio.exe")
    if not os.path.exists(exe_path):
        err(f"No se encontro el ejecutable en: {exe_path}")

    exe_size_mb = os.path.getsize(exe_path) / (1024 * 1024)
    ok(f"Tornio.exe generado ({exe_size_mb:.1f} MB): {exe_path}")

    header("PASO 4/5: Compilando Instalador con Inno Setup 6")
    iscc_path = find_iscc()
    step(f"Ejecutando ISCC: {iscc_path}")
    res = subprocess.run([iscc_path, ISS_FILE], cwd=INSTALLER_DIR)
    if res.returncode != 0:
        err("Inno Setup fallo al compilar el instalador.")

    installer_path = os.path.join(DIST_DIR, f"Tornio_Setup_v{VERSION}.exe")
    if not os.path.exists(installer_path):
        err(f"No se encontro el instalador generado en: {installer_path}")

    installer_size_mb = os.path.getsize(installer_path) / (1024 * 1024)
    ok(f"Tornio_Setup_v{VERSION}.exe generado ({installer_size_mb:.1f} MB)")

    header("PASO 5/5: Generando Manifiesto Criptografico SHA256SUMS.txt")
    sha_manifest_path = os.path.join(DIST_DIR, "SHA256SUMS.txt")
    records = write_sha256sums([installer_path, exe_path], sha_manifest_path)
    ok(f"Manifiesto SHA256SUMS.txt generado en: {sha_manifest_path}")

    elapsed = time.time() - start_time
    header(f"COMPILACION COMPLETADA EN {elapsed:.0f} SEGUNDOS")
    for name, digest, size_mb in records:
        print(f"  {name} ({size_mb:.1f} MB)")
        print(f"    SHA-256: {digest}")


if __name__ == "__main__":
    main()
