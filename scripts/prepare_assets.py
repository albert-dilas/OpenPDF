"""
Genera y prepara todos los recursos graficos del instalador y escritorio de OpenPDF v2.2.0:
  - openpdf.ico (icono multi-resolucion verdadero 256, 128, 64, 48, 32, 24, 16 px)
  - openpdf_256.png (icono de alta resolucion 256x256)
  - frontend/src/app/favicon.ico y frontend/public/icon.png
  - wizard_banner.bmp (328x628 px - panel lateral de alta densidad para Inno Setup modern)
  - wizard_small.bmp (110x116 px - emblema superior derecho para Inno Setup modern)

No requiere archivos externos fuera del repositorio.
"""
import os
import shutil
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

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
    """Genera un emblema de escritorio de alta definicion (supersampled) para icono e instalador."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    pad = int(size * 0.055)
    radius = int(size * 0.225)
    box = [pad, pad, size - pad, size - pad]

    # Sombra exterior suave del contenedor
    shadow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    shadow_offset = max(2, int(size * 0.018))
    shadow_draw.rounded_rectangle(
        [pad, pad + shadow_offset, size - pad, size - pad + shadow_offset],
        radius=radius,
        fill=(15, 23, 42, 95),
    )
    blur_radius = max(1, int(size * 0.02))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(blur_radius))
    canvas = Image.alpha_composite(canvas, shadow_layer)

    # Mascara redondeada y degradado vertical rojo corporativo (#EF4444 -> #B91C1C)
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(box, radius=radius, fill=255)

    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    grad_draw = ImageDraw.Draw(grad)
    top_color = (239, 68, 68)    # #EF4444
    bot_color = (185, 28, 28)    # #B91C1C
    span = max(1, (size - 2 * pad))
    for y in range(pad, size - pad + 1):
        t = (y - pad) / float(span)
        r = int(top_color[0] * (1 - t) + bot_color[0] * t)
        g = int(top_color[1] * (1 - t) + bot_color[1] * t)
        b = int(top_color[2] * (1 - t) + bot_color[2] * t)
        grad_draw.line([(pad, y), (size - pad, y)], fill=(r, g, b, 255))

    bg_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg_layer.paste(grad, (0, 0), mask)
    canvas = Image.alpha_composite(canvas, bg_layer)

    # Bisel / borde interior luminoso compuesto con alpha_composite
    border_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    border_draw = ImageDraw.Draw(border_layer)
    inner_pad = pad + max(2, int(size * 0.016))
    border_draw.rounded_rectangle(
        [inner_pad, inner_pad, size - inner_pad, size - inner_pad],
        radius=max(4, radius - int(size * 0.016)),
        outline=(255, 255, 255, 65),
        width=max(2, int(size * 0.01)),
    )
    canvas = Image.alpha_composite(canvas, border_layer)

    draw = ImageDraw.Draw(canvas)

    # Hoja de documento central con esquina superior derecha doblada (pliego)
    doc_w = int(size * 0.48)
    doc_h = int(size * 0.60)
    doc_x1 = (size - doc_w) // 2
    doc_y1 = int(size * 0.19)
    doc_x2 = doc_x1 + doc_w
    doc_y2 = doc_y1 + doc_h
    fold = int(doc_w * 0.25)
    doc_radius = int(size * 0.045)

    # Sombra proyectada por la hoja sobre el fondo rojo
    doc_shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ds_draw = ImageDraw.Draw(doc_shadow)
    ds_off = max(2, int(size * 0.015))
    ds_draw.rounded_rectangle(
        [doc_x1, doc_y1 + ds_off, doc_x2, doc_y2 + ds_off],
        radius=doc_radius,
        fill=(69, 10, 10, 115),
    )
    doc_shadow = doc_shadow.filter(ImageFilter.GaussianBlur(max(1, int(size * 0.016))))
    canvas = Image.alpha_composite(canvas, doc_shadow)

    # Cuerpo blanco de la hoja recortando la esquina doblada
    doc_mask_base = Image.new("L", (size, size), 0)
    dmb_draw = ImageDraw.Draw(doc_mask_base)
    dmb_draw.rounded_rectangle([doc_x1, doc_y1, doc_x2, doc_y2], radius=doc_radius, fill=255)

    cut_poly = Image.new("L", (size, size), 255)
    cp_draw = ImageDraw.Draw(cut_poly)
    cp_draw.polygon(
        [(doc_x2 - fold, doc_y1 - 2), (doc_x2 + 2, doc_y1 - 2), (doc_x2 + 2, doc_y1 + fold)],
        fill=0,
    )
    doc_mask = ImageChops.darker(doc_mask_base, cut_poly)

    doc_layer = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    canvas.paste(doc_layer, (0, 0), doc_mask)
    draw = ImageDraw.Draw(canvas)

    # Solapa doblada (esquina superior derecha) con sombreado sutil
    flap_pts = [
        (doc_x2 - fold, doc_y1),
        (doc_x2, doc_y1 + fold),
        (doc_x2 - fold, doc_y1 + fold),
    ]
    draw.polygon(flap_pts, fill=(226, 232, 240, 255))

    # Lineas de contenido simuladas en la parte superior de la hoja
    line_margin = int(doc_w * 0.16)
    line_h = max(3, int(size * 0.022))
    for idx, rel_y in enumerate([0.16, 0.25]):
        ly = doc_y1 + int(doc_h * rel_y)
        max_x = (doc_x2 - fold - int(doc_w * 0.08)) if idx == 0 else (doc_x2 - line_margin)
        draw.rounded_rectangle(
            [doc_x1 + line_margin, ly, max_x, ly + line_h],
            radius=max(2, line_h // 2),
            fill=(203, 213, 225, 255),
        )

    # Lineas inferiores bajo la banda PDF
    for idx, rel_y in enumerate([0.75, 0.85]):
        ly = doc_y1 + int(doc_h * rel_y)
        max_x = (doc_x2 - line_margin) if idx == 0 else (doc_x2 - int(doc_w * 0.34))
        draw.rounded_rectangle(
            [doc_x1 + line_margin, ly, max_x, ly + line_h],
            radius=max(2, line_h // 2),
            fill=(203, 213, 225, 255),
        )

    # Banda transversal oscura (#0F172A) con texto "PDF" de alto contraste
    band_h = int(size * 0.175)
    band_y1 = doc_y1 + int(doc_h * 0.38)
    band_pad_x = int(size * 0.048)
    band_box = [doc_x1 - band_pad_x, band_y1, doc_x2 + band_pad_x, band_y1 + band_h]

    # Sombra de la banda
    band_shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bs_draw = ImageDraw.Draw(band_shadow)
    bs_off = max(2, int(size * 0.01))
    bs_draw.rounded_rectangle(
        [band_box[0], band_box[1] + bs_off, band_box[2], band_box[3] + bs_off],
        radius=int(size * 0.036),
        fill=(15, 23, 42, 110),
    )
    band_shadow = band_shadow.filter(ImageFilter.GaussianBlur(max(1, int(size * 0.01))))
    canvas = Image.alpha_composite(canvas, band_shadow)
    draw = ImageDraw.Draw(canvas)

    draw.rounded_rectangle(
        band_box,
        radius=int(size * 0.036),
        fill=(15, 23, 42, 255),
        outline=(51, 65, 85, 255),
        width=max(1, int(size * 0.006)),
    )

    font = _load_font(int(size * 0.125), bold=True)
    text = "PDF"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(
        ((size - tw) / 2 - bbox[0], band_y1 + (band_h - th) / 2 - bbox[1]),
        text,
        fill=(255, 255, 255, 255),
        font=font,
    )

    return canvas


def generate_wizard_banner(dst_path: str) -> None:
    """Genera el panel lateral del instalador (328x628 px, 24-bit BMP) con estetica corporativa."""
    w, h = 328, 628
    img = Image.new("RGB", (w, h), (15, 23, 42))
    draw = ImageDraw.Draw(img)

    # Degradado vertical sobrio Slate-900 -> Slate-950
    for y in range(h):
        ratio = y / float(h)
        r = int(15 * (1 - ratio) + 9 * ratio)
        g = int(23 * (1 - ratio) + 14 * ratio)
        b = int(42 * (1 - ratio) + 28 * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Reticula geometrica sutil
    grid_step = 32
    for gx in range(0, w, grid_step):
        draw.line([(gx, 0), (gx, h)], fill=(30, 41, 59), width=1)
    for gy in range(0, h, grid_step):
        draw.line([(0, gy), (w, gy)], fill=(30, 41, 59), width=1)

    # Barra superior de acento corporativo (#E5322D)
    draw.rectangle([0, 0, w, 8], fill=(229, 50, 45))

    # Emblema central superior renderizado desde alta resolucion
    emblem = create_brand_emblem(512).resize((136, 136), Image.Resampling.LANCZOS)
    img.paste(emblem, (34, 48), emblem)

    # Titulo y version
    font_title = _load_font(30, bold=True)
    font_ver = _load_font(14, bold=True)
    font_sub = _load_font(14, bold=False)
    font_badge = _load_font(12, bold=True)

    draw.text((40, 206), "OpenPDF", fill=(255, 255, 255), font=font_title)
    draw.rounded_rectangle([188, 213, 258, 237], radius=6, fill=(229, 50, 45))
    draw.text((200, 216), "v2.2.0", fill=(255, 255, 255), font=font_ver)

    draw.text((40, 250), "Suite Documental Local-First", fill=(148, 163, 184), font=font_sub)

    # Linea divisoria
    draw.line([(40, 290), (w - 40, 290)], fill=(51, 65, 85), width=1)

    # Pildoras de especificaciones tecnicas
    specs = [
        ("EJECUCION 100% LOCAL", "Sin envio de archivos a la nube"),
        ("21 MODULOS INTEGRADOS", "Firmar, censurar, traducir, QR y mas"),
        ("SEGURIDAD AES-256 + SSRF", "Cifrado y proteccion de red"),
        ("STREAMING OPTIMIZADO", "Validacion binaria y baja memoria"),
    ]

    y_cursor = 314
    font_spec_title = _load_font(12, bold=True)
    font_spec_desc = _load_font(12, bold=False)

    for title, desc in specs:
        draw.rounded_rectangle(
            [36, y_cursor, w - 36, y_cursor + 56],
            radius=10,
            fill=(23, 33, 53),
            outline=(45, 58, 82),
            width=1,
        )
        draw.rectangle([36, y_cursor + 12, 40, y_cursor + 44], fill=(229, 50, 45))
        draw.text((52, y_cursor + 10), title, fill=(248, 250, 252), font=font_spec_title)
        draw.text((52, y_cursor + 30), desc, fill=(148, 163, 184), font=font_spec_desc)
        y_cursor += 68

    # Pie del banner
    draw.text((40, h - 34), "Licencia MIT  |  OpenPDF Project", fill=(100, 116, 139), font=font_badge)

    img.save(dst_path, format="BMP")


def generate_wizard_small(dst_path: str) -> None:
    """Genera el emblema superior derecho del wizard (110x116 px, 24-bit BMP)."""
    w, h = 110, 116
    img = Image.new("RGB", (w, h), (255, 255, 255))
    emblem = create_brand_emblem(512).resize((88, 88), Image.Resampling.LANCZOS)
    img.paste(emblem, ((w - 88) // 2, (h - 88) // 2), emblem)
    img.save(dst_path, format="BMP")


def main() -> None:
    png_256_path = os.path.join(INSTALLER_DIR, "openpdf_256.png")
    ico_path = os.path.join(INSTALLER_DIR, "openpdf.ico")
    banner_path = os.path.join(INSTALLER_DIR, "wizard_banner.bmp")
    small_path = os.path.join(INSTALLER_DIR, "wizard_small.bmp")

    # Siempre regenerar desde master supersampled 1024x1024
    master_icon = create_brand_emblem(1024)
    icon_256 = master_icon.resize((256, 256), Image.Resampling.LANCZOS)
    icon_256.save(png_256_path, format="PNG")

    ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (24, 24), (16, 16)]
    icon_256.save(ico_path, format="ICO", sizes=ico_sizes)
    ico_bytes = os.path.getsize(ico_path)
    if ico_bytes < 15000:
        raise RuntimeError(f"El archivo ICO generado es demasiado pequeno ({ico_bytes} bytes)")
    print(f"[OK] Icono multi-resolucion HD generado ({ico_bytes} bytes): {ico_path}")

    # Sincronizar favicon e icono del frontend
    if os.path.isdir(FRONTEND_APP_DIR):
        favicon_dst = os.path.join(FRONTEND_APP_DIR, "favicon.ico")
        shutil.copy2(ico_path, favicon_dst)
        print(f"[OK] Favicon sincronizado: {favicon_dst}")

    if os.path.isdir(FRONTEND_PUBLIC_DIR):
        public_icon_dst = os.path.join(FRONTEND_PUBLIC_DIR, "icon.png")
        icon_256.save(public_icon_dst, format="PNG")
        print(f"[OK] Icono publico sincronizado: {public_icon_dst}")

    generate_wizard_banner(banner_path)
    print(f"[OK] Banner lateral del instalador generado (328x628): {banner_path}")

    generate_wizard_small(small_path)
    print(f"[OK] Emblema pequeno del instalador generado (110x116): {small_path}")


if __name__ == "__main__":
    main()
