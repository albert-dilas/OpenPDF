"""
Genera y prepara todos los recursos gráficos del instalador de OpenPDF v2.0:
  - openpdf.ico (icono multi-resolución 16, 24, 32, 48, 64, 128, 256 px)
  - openpdf_256.png (icono de alta resolución)
  - wizard_banner.bmp (328x628 px - panel lateral de alta densidad para Inno Setup modern)
  - wizard_small.bmp (110x116 px - emblema superior derecho para Inno Setup modern)

No requiere archivos externos fuera del repositorio.
"""
import os
from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INSTALLER_DIR = os.path.join(PROJECT_ROOT, "installer")
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


def create_brand_emblem(size: int = 512) -> Image.Image:
    """Genera un emblema vectorial limpio de alta resolución para el icono y el instalador."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = int(size * 0.06)
    radius = int(size * 0.22)

    # Sombra suave e insignia principal en rojo corporativo (#E5322D)
    draw.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=radius,
        fill=(229, 50, 45, 255),
    )

    # Borde interior sutil
    inner_pad = pad + max(2, int(size * 0.02))
    draw.rounded_rectangle(
        [inner_pad, inner_pad, size - inner_pad, size - inner_pad],
        radius=max(4, radius - 4),
        outline=(255, 255, 255, 55),
        width=max(2, int(size * 0.012)),
    )

    # Hoja de documento estilizada en blanco
    doc_w = int(size * 0.46)
    doc_h = int(size * 0.56)
    doc_x1 = (size - doc_w) // 2
    doc_y1 = int(size * 0.22)
    doc_x2 = doc_x1 + doc_w
    doc_y2 = doc_y1 + doc_h

    draw.rounded_rectangle(
        [doc_x1, doc_y1, doc_x2, doc_y2],
        radius=int(size * 0.045),
        fill=(255, 255, 255, 255),
    )

    # Banda "PDF" sobre el documento
    band_h = int(size * 0.16)
    band_y1 = doc_y1 + int(doc_h * 0.34)
    draw.rounded_rectangle(
        [doc_x1 - int(size * 0.04), band_y1, doc_x2 + int(size * 0.04), band_y1 + band_h],
        radius=int(size * 0.03),
        fill=(15, 23, 42, 255),
    )

    font = _load_font(int(size * 0.115), bold=True)
    text = "PDF"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(
        ((size - tw) / 2, band_y1 + (band_h - th) / 2 - bbox[1]),
        text,
        fill=(255, 255, 255, 255),
        font=font,
    )

    # Líneas decorativas en la hoja
    line_margin = int(doc_w * 0.2)
    for idx, rel_y in enumerate([0.16, 0.24, 0.72, 0.82]):
        ly = doc_y1 + int(doc_h * rel_y)
        lx2 = doc_x2 - line_margin if idx != 3 else doc_x2 - int(doc_w * 0.38)
        draw.rounded_rectangle(
            [doc_x1 + line_margin, ly, lx2, ly + max(3, int(size * 0.022))],
            radius=2,
            fill=(203, 213, 225, 255),
        )

    return img


def generate_wizard_banner(dst_path: str) -> None:
    """Genera el panel lateral del instalador (328x628 px, 24-bit BMP) con estética corporativa."""
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

    # Retícula geométrica sutil
    grid_step = 32
    for gx in range(0, w, grid_step):
        draw.line([(gx, 0), (gx, h)], fill=(30, 41, 59), width=1)
    for gy in range(0, h, grid_step):
        draw.line([(0, gy), (w, gy)], fill=(30, 41, 59), width=1)

    # Barra superior de acento corporativo (#E5322D)
    draw.rectangle([0, 0, w, 8], fill=(229, 50, 45))

    # Emblema central superior
    emblem = create_brand_emblem(136)
    img.paste(emblem, (34, 48), emblem)

    # Título y versión
    font_title = _load_font(30, bold=True)
    font_ver = _load_font(14, bold=True)
    font_sub = _load_font(14, bold=False)
    font_badge = _load_font(12, bold=True)

    draw.text((40, 206), "OpenPDF", fill=(255, 255, 255), font=font_title)
    draw.rounded_rectangle([188, 213, 258, 237], radius=6, fill=(229, 50, 45))
    draw.text((200, 216), "v2.0.0", fill=(255, 255, 255), font=font_ver)

    draw.text((40, 250), "Suite Documental Local-First", fill=(148, 163, 184), font=font_sub)

    # Línea divisoria
    draw.line([(40, 290), (w - 40, 290)], fill=(51, 65, 85), width=1)

    # Píldoras de especificaciones técnicas
    specs = [
        ("EJECUCION 100% LOCAL", "Sin envio de archivos a la nube"),
        ("16 MODULOS INTEGRADOS", "Organizar, convertir, OCR y editar"),
        ("SEGURIDAD AES-256", "Cifrado criptografico estandar"),
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
    emblem = create_brand_emblem(88)
    img.paste(emblem, ((w - 88) // 2, (h - 88) // 2), emblem)
    img.save(dst_path, format="BMP")


def main() -> None:
    png_256_path = os.path.join(INSTALLER_DIR, "openpdf_256.png")
    ico_path = os.path.join(INSTALLER_DIR, "openpdf.ico")
    banner_path = os.path.join(INSTALLER_DIR, "wizard_banner.bmp")
    small_path = os.path.join(INSTALLER_DIR, "wizard_small.bmp")

    if os.path.exists(png_256_path):
        base_icon = Image.open(png_256_path).convert("RGBA")
    else:
        base_icon = create_brand_emblem(256)
        base_icon.save(png_256_path, format="PNG")

    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    frames = [base_icon.resize(s, Image.Resampling.LANCZOS) for s in sizes]
    frames[0].save(ico_path, format="ICO", sizes=sizes, append_images=frames[1:])
    print(f"[OK] Icono multi-resolucion actualizado: {ico_path}")

    generate_wizard_banner(banner_path)
    print(f"[OK] Banner lateral del instalador generado (328x628): {banner_path}")

    generate_wizard_small(small_path)
    print(f"[OK] Emblema pequeno del instalador generado (110x116): {small_path}")


if __name__ == "__main__":
    main()
