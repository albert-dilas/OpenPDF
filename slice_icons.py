import os
from PIL import Image

img_path = r'C:/Users/Albert/.gemini/antigravity/brain/40dbc95a-3ecf-4d16-884a-fcae12792e1c/.user_uploaded/media_1790476148578.png'
out_dir = r'C:/Users/Albert/Documents/OpenPDF/frontend/public/icons'
os.makedirs(out_dir, exist_ok=True)

img = Image.open(img_path)
width, height = img.size
cols, rows = 7, 2

cell_w = width / cols
cell_h = height / rows

# Nombres basados en el orden de las herramientas
names = [
    "merge-pdf", "split-pdf", "compress-pdf", "pdf-to-word", "word-to-pdf", "ocr-pdf", "jpg-to-pdf",
    "pdf-to-jpg", "watermark-pdf", "page-numbers-pdf", "unlock-pdf", "rotate-pdf", "protect-pdf", "pdf-to-markdown"
]

idx = 0
for r in range(rows):
    for c in range(cols):
        left = c * cell_w
        top = r * cell_h
        right = (c + 1) * cell_w
        bottom = (r + 1) * cell_h
        
        icon = img.crop((left, top, right, bottom))
        icon.save(os.path.join(out_dir, f"{names[idx]}.png"))
        idx += 1

print("Iconos extraídos exitosamente!")
