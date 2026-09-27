"""
Prepara todos los assets visuales para el build:
- Convierte el icono JPG -> ICO (multi-resolucion: 16, 32, 48, 64, 128, 256)
- Redimensiona el banner del instalador a las dimensiones exactas de Inno Setup
"""
import os
import sys
from PIL import Image

# Rutas
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACT_DIR = os.path.join(PROJECT_ROOT, "design", "raw_assets")
INSTALLER_DIR = os.path.join(PROJECT_ROOT, "installer")

os.makedirs(INSTALLER_DIR, exist_ok=True)

# 1. Icono: JPG -> ICO multi-resolucion
icon_src = os.path.join(ARTIFACT_DIR, "icon.jpg")
icon_dst = os.path.join(INSTALLER_DIR, "openpdf.ico")

print("[1/2] Generando ICO desde:", icon_src)

img = Image.open(icon_src).convert("RGBA")

sizes = [(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)]
icons = []
for size in sizes:
    resized = img.resize(size, Image.LANCZOS)
    icons.append(resized)

icons[0].save(
    icon_dst,
    format="ICO",
    sizes=[(s[0], s[1]) for s in sizes],
    append_images=icons[1:]
)
print("    [OK] ICO guardado:", icon_dst)

# PNG 256x256
icon_png = os.path.join(INSTALLER_DIR, "openpdf_256.png")
img.resize((256, 256), Image.LANCZOS).save(icon_png, format="PNG")
print("    [OK] PNG 256px:", icon_png)

# 2. Banners del wizard de Inno Setup
banner_src = os.path.join(ARTIFACT_DIR, "banner.jpg")
banner_dst = os.path.join(INSTALLER_DIR, "wizard_banner.bmp")
small_dst  = os.path.join(INSTALLER_DIR, "wizard_small.bmp")

print("\n[2/2] Generando banners del wizard desde:", banner_src)

banner_img = Image.open(banner_src).convert("RGB")

# Panel lateral grande (164x314) - WizardImageFile
banner_resized = banner_img.resize((164, 314), Image.LANCZOS)
banner_resized.save(banner_dst, format="BMP")
print("    [OK] Banner wizard (164x314):", banner_dst)

# Imagen pequena esquina (55x58) - WizardSmallImageFile
small_img = img.convert("RGB").resize((55, 58), Image.LANCZOS)
small_img.save(small_dst, format="BMP")
print("    [OK] Imagen pequena wizard (55x58):", small_dst)

print("\n[DONE] Assets preparados correctamente en:", INSTALLER_DIR)
