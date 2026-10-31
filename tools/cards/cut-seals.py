# Recorta los sellos de Codex de su fondo magenta y arma una hoja de control a varios tamaños.
# Uso, desde la raíz: python tools/cards/cut-seals.py
import numpy as np
from PIL import Image, ImageFilter

RAW = 'data/cards/raw/sellos'
OUT = 'apps/mobile/assets/cards'
NAMES = ['sello-amenazada', 'sello-casi', 'sello-endemica', 'sello-emblematica']
SIZE = 256

cuts = []
for name in NAMES:
    im = Image.open(f'{RAW}/{name}.png').convert('RGB')
    rgb = np.asarray(im, dtype=np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # El magenta tiene rojo y azul altos y verde bajo.
    distance = np.minimum(r, b) - g
    alpha = np.clip(1 - (distance - 60) / 70, 0, 1)
    mask = Image.fromarray(np.uint8(alpha * 255)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    # Quita el tinte magenta que queda en el borde.
    edge = (np.asarray(mask, dtype=np.float32) / 255)[..., None]
    fixed = rgb.copy()
    tint = np.clip(np.minimum(r, b) - g, 0, None)[..., None]
    fixed[..., [0]] -= tint * (1 - edge) * 0.9
    fixed[..., [2]] -= tint * (1 - edge) * 0.9
    cut = Image.fromarray(np.uint8(np.clip(fixed, 0, 255)))
    cut.putalpha(mask)
    box = mask.point(lambda v: 255 if v > 40 else 0).getbbox()
    cut = cut.crop(box)
    side = max(cut.size)
    square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    square.paste(cut, ((side - cut.width) // 2, (side - cut.height) // 2))
    square = square.resize((SIZE, SIZE), Image.LANCZOS)
    square.save(f'{OUT}/{name}.webp', quality=88, method=6)
    cuts.append(square)
    print(name, im.size, box)

backgrounds = ['#F7F0DF', '#3D858D', '#1E2A1B']
sizes = [120, 56, 36]
board = Image.new('RGB', (4 * 130 * 2 + 20, 3 * 130), '#777777')
for row, color in enumerate(backgrounds):
    band = Image.new('RGB', (board.width, 130), color)
    x = 8
    for size in sizes[:2]:
        for cut in cuts:
            small = cut.resize((size, size), Image.LANCZOS)
            band.paste(small, (x, (130 - size) // 2), small)
            x += size + 8
    for cut in cuts:
        small = cut.resize((sizes[2], sizes[2]), Image.LANCZOS)
        band.paste(small, (x, (130 - sizes[2]) // 2), small)
        x += sizes[2] + 8
    board.paste(band, (0, row * 130))
board.save(f'{RAW}/control-sellos.jpg', quality=90)
print(board.size)
