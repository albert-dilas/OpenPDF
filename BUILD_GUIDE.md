# Build Guide — Tornio v3.0.0

This guide explains how to run Tornio from source and package standalone Windows artifacts (`Tornio.exe`, `Tornio_Setup_v3.0.0.exe`, and `SHA256SUMS.txt`).

---

## Prerequisites

- **Operating System**: Windows 10 / 11 x64 (for PyInstaller `.exe` and Inno Setup packaging; source execution also works on Linux and macOS)
- **Python**: 3.12+
- **Node.js**: 20 LTS (or 18+)
- **Inno Setup**: v6 (required only when building `Tornio_Setup_vX.Y.Z.exe`)

---

## 1. Local Environment Setup

```powershell
# 1. Clone the repository
git clone https://github.com/albert-dilas/Tornio.git
cd Tornio

# 2. Install frontend dependencies
npm --prefix frontend ci

# 3. Create backend virtual environment and install dependencies
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -r requirements-dev.txt
cd ..
```

---

## 2. Running in Development Mode

Terminal 1 (FastAPI Backend on `127.0.0.1:8000`):

```powershell
.\backend\.venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

Terminal 2 (Next.js Frontend Dev Server on `http://localhost:3000`):

```powershell
npm --prefix frontend run dev
```

---

## 3. Running Verification Checks

```powershell
# Backend test suite
.\backend\.venv\Scripts\python -m pytest backend/tests -q

# Frontend lint, typecheck, and static export
npm --prefix frontend run lint
npx --prefix frontend tsc -p frontend/tsconfig.json --noEmit
npm --prefix frontend run build
```

---

## 4. Packaging Portable Binary & Minimalist 3-Step Installer

Run the unified release build pipeline from the repository root:

```powershell
.\backend\.venv\Scripts\python scripts/build_installer.py
```

Internally, `scripts/build_installer.py` executes 5 steps:
1. **Asset Preparation (`scripts/prepare_assets.py`)**: Supersamples `tornio.ico` (`16px..256px`), installer bitmaps (`wizard_banner.bmp`, `wizard_small.bmp`), `frontend/src/app/favicon.ico`, and `frontend/public/icon.png`.
2. **Static Offline UI (`npm --prefix frontend run build`)**: Exports 76 static Next.js routes into `frontend/out` with embedded fonts and icons.
3. **Portable Executable (`installer/Tornio.spec`)**: Packages FastAPI, domain libraries, `frontend/out`, and tray resources into `dist/Tornio.exe`.
4. **Windows Installer (`installer/Tornio_Installer.iss`)**: Compiles the 3-step per-user Inno Setup 6 wizard (`PrivilegesRequired=lowest`) into `dist/Tornio_Setup_v3.0.0.exe`, syncing user choices into `%LOCALAPPDATA%\Tornio\config.json`.
5. **Cryptographic Manifest (`dist/SHA256SUMS.txt`)**: Generates SHA-256 digests used by the in-app `SelfUpdaterManager` to verify downloaded releases before execution.

For a portable executable only (skipping Inno Setup):

```powershell
.\backend\.venv\Scripts\python scripts/build_exe.py
```
