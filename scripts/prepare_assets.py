"""
Genera y prepara todos los recursos graficos del instalador y escritorio de Tornio v3.0.0:
  - tornio.ico (icono multi-resolucion 256, 128, 64, 48, 32, 24, 16 px)
  - tornio_256.png (icono de alta resolucion 256x256)
  - frontend/src/app/favicon.ico y frontend/public/icon.png
  - wizard_banner.bmp (328x628 px - panel lateral minimalista para Inno Setup 6)
  - wizard_small.bmp (110x116 px - emblema superior derecho para Inno Setup 6)
"""
import os
import shutil
from PIL import Image, ImageDraw, ImageFilter, ImageFont

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INSTALLER_DIR = os.path.join(PROJECT_ROOT, "installer")
FRONTEND_APP_DIR = os.path.join(PROJECT_ROOT, "frontend", "src", "app")
FRONTEND_PUBLIC_DIR = os.path.join(PROJECT_ROOT, "frontend", "public")
os.makedirs(INSTALLER_DIR, exist_ok=True)


def _load_font(size: int, bold: bool = False):
    candidates = (
        ["segoeuib.ttf", "arialbd.ttf", "calibrib.ttf"]
        if bold
        else ["segoeui.ttf", "arial.ttf", "calibri.ttf"]
    )
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def create_brand_emblem(size: int = 1024) -> Image.Image:
    """
    Genera el emblema geometrico minimalista de Tornio (supersampled):
    - Squircle obsidiana profundo (#111214) con borde sutil nitido
    - Arco de eje de precision
    - Barra arquitectonica geometrica 'T' en blanco puro
    - Punto de calibracion bermellon (#E04826)
    """
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    pad = int(size * 0.055)
    radius = int(size * 0.24)
    box = [pad, pad, size - pad, size - pad]

    shadow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    shadow_offset = max(2, int(size * 0.016))
    shadow_draw.rounded_rectangle(
        [pad, pad + shadow_offset, size - pad, size - pad + shadow_offset],
        radius=radius,
        fill=(0, 0, 0, 95),
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(max(1, int(size * 0.018))))
    canvas = Image.alpha_composite(canvas, shadow_layer)

    body_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    body_draw = ImageDraw.Draw(body_layer)
    body_draw.rounded_rectangle(box, radius=radius, fill=(17, 18, 20, 255))
    canvas = Image.alpha_composite(canvas, body_layer)

    rim_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rim_draw = ImageDraw.Draw(rim_layer)
    rim_width = max(1, round(size / 256.0))
    rim_inset = pad + max(1, rim_width // 2)
    rim_draw.rounded_rectangle(
        [rim_inset, rim_inset, size - rim_inset, size - rim_inset],
        radius=max(4, radius - max(1, rim_width // 2)),
        outline=(255, 255, 255, 36),
        width=rim_width,
    )
    canvas = Image.alpha_composite(canvas, rim_layer)

    axis_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    axis_draw = ImageDraw.Draw(axis_layer)
    ring_margin = int(size * 0.165)
    ring_width = max(1, int(size * 0.016))
    axis_draw.arc(
        [ring_margin, ring_margin, size - ring_margin, size - ring_margin],
        start=210,
        end=30,
        fill=(255, 255, 255, 42),
        width=ring_width,
    )
    canvas = Image.alpha_composite(canvas, axis_layer)

    draw = ImageDraw.Draw(canvas)

    bar_x1 = int(size * 0.255)
    bar_x2 = int(size * 0.745)
    bar_y1 = int(size * 0.275)
    bar_y2 = int(size * 0.380)
    bar_r = max(2, int(size * 0.026))
    draw.rounded_rectangle(
        [bar_x1, bar_y1, bar_x2, bar_y2],
        radius=bar_r,
        fill=(255, 255, 255, 255),
    )

    stem_w = int(size * 0.114)
    stem_x1 = (size - stem_w) // 2
    stem_x2 = stem_x1 + stem_w
    stem_y1 = bar_y2 - max(2, int(size * 0.012))
    stem_y2 = int(size * 0.735)
    draw.rounded_rectangle(
        [stem_x1, stem_y1, stem_x2, stem_y2],
        radius=bar_r,
        fill=(255, 255, 255, 255),
    )

    dot_cx = int(size * 0.675)
    dot_cy = int(size * 0.650)
    dot_r = max(2, int(size * 0.064))
    draw.ellipse(
        [dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r],
        fill=(224, 72, 38, 255),
    )

    return canvas


def generate_wizard_banner(dst_path: str) -> None:
    """Genera el panel lateral minimalista del instalador (328x628 px, 24-bit BMP)."""
    w, h = 328, 628
    img = Image.new("RGB", (w, h), (15, 16, 19))
    draw = ImageDraw.Draw(img)

    # Degradado vertical sobrio Carbon Obsidian
    for y in range(h):
        ratio = y / float(h)
        r = int(17 * (1 - ratio) + 10 * ratio)
        g = int(18 * (1 - ratio) + 11 * ratio)
        b = int(20 * (1 - ratio) + 13 * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Acento bermellon superior ultra limpio (4px)
    draw.rectangle([0, 0, w, 4], fill=(224, 72, 38))

    # Emblema central minimalista
    emblem = create_brand_emblem(512).resize((112, 112), Image.Resampling.LANCZOS)
    img.paste(emblem, (40, 72), emblem)

    font_title = _load_font(32, bold=True)
    font_ver = _load_font(12, bold=True)
    font_sub = _load_font(14, bold=False)
    font_item = _load_font(13, bold=False)
    font_foot = _load_font(11, bold=False)

    draw.text((40, 210), "Tornio", fill=(255, 255, 255), font=font_title)
    draw.rounded_rectangle([152, 218, 214, 240], radius=5, fill=(224, 72, 38))
    draw.text((163, 222), "v3.0.0", fill=(255, 255, 255), font=font_ver)

    draw.text((40, 254), "Local-First Workbench", fill=(161, 161, 170), font=font_sub)

    # Separador sutil
    draw.line([(40, 300), (w - 40, 300)], fill=(39, 41, 48), width=1)

    # Tres puntos clave minimalistas sin saturacion de cajas
    pillars = [
        "100% Local en 127.0.0.1",
        "7 Studios  |  58 Herramientas",
        "Verificacion SHA-256",
    ]
    y_cursor = 328
    for text_line in pillars:
        draw.ellipse([40, y_cursor + 5, 46, y_cursor + 11], fill=(224, 72, 38))
        draw.text((58, y_cursor), text_line, fill=(212, 212, 216), font=font_item)
        y_cursor += 34

    draw.text((40, h - 38), "Apache License 2.0  |  Tornio", fill=(113, 113, 122), font=font_foot)
    img.save(dst_path, format="BMP")


def generate_wizard_small(dst_path: str) -> None:
    """Genera el emblema superior derecho del wizard (110x116 px, 24-bit BMP)."""
    w, h = 110, 116
    img = Image.new("RGB", (w, h), (255, 255, 255))
    emblem = create_brand_emblem(512).resize((86, 86), Image.Resampling.LANCZOS)
    img.paste(emblem, ((w - 86) // 2, (h - 86) // 2), emblem)
    img.save(dst_path, format="BMP")


def main() -> None:
    tornio_png_path = os.path.join(INSTALLER_DIR, "tornio_256.png")
    tornio_ico_path = os.path.join(INSTALLER_DIR, "tornio.ico")
    banner_path = os.path.join(INSTALLER_DIR, "wizard_banner.bmp")
    small_path = os.path.join(INSTALLER_DIR, "wizard_small.bmp")

    master_icon = create_brand_emblem(1024)
    icon_256 = master_icon.resize((256, 256), Image.Resampling.LANCZOS)
    icon_256.save(tornio_png_path, format="PNG")

    ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (24, 24), (16, 16)]
    icon_256.save(tornio_ico_path, format="ICO", sizes=ico_sizes)

    ico_bytes = os.path.getsize(tornio_ico_path)
    if ico_bytes < 15000:
        raise RuntimeError(f"El archivo ICO generado es demasiado pequeno ({ico_bytes} bytes)")
    print(f"[OK] Icono multi-resolucion HD generado ({ico_bytes} bytes): {tornio_ico_path}")

    if os.path.isdir(FRONTEND_APP_DIR):
        favicon_dst = os.path.join(FRONTEND_APP_DIR, "favicon.ico")
        shutil.copy2(tornio_ico_path, favicon_dst)
        print(f"[OK] Favicon sincronizado: {favicon_dst}")

    if os.path.isdir(FRONTEND_PUBLIC_DIR):
        public_icon_dst = os.path.join(FRONTEND_PUBLIC_DIR, "icon.png")
        icon_256.save(public_icon_dst, format="PNG")
        print(f"[OK] Icono publico sincronizado: {public_icon_dst}")

    generate_wizard_banner(banner_path)
    print(f"[OK] Banner lateral minimalista generado (328x628): {banner_path}")

    generate_wizard_small(small_path)
    print(f"[OK] Emblema pequeno del instalador generado (110x116): {small_path}")


if __name__ == "__main__":
    main()
