# Prepara el arte de las cartas desde lo que generaron Codex y Gemini (data/cards/raw/) y lo deja en
# apps/mobile/assets/cards/. Uso, desde la raíz: python tools/cards/prepare-art.py
import colorsys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAW = 'data/cards/raw'
CODEX = f'{RAW}/codex'
GEMINI = f'{RAW}/gemini/plumario-cartas-'
OUT = 'apps/mobile/assets/cards'
CARD = (720, 1008)


def cover(im, size, cy=0.5):
    w, h = im.size
    tw, th = size
    scale = max(tw / w, th / h)
    nw, nh = round(w * scale), round(h * scale)
    im = im.resize((nw, nh), Image.LANCZOS)
    left = (nw - tw) // 2
    top = round((nh - th) * cy)
    return im.crop((left, top, left + tw, top + th))


def hexrgb(value):
    value = value.lstrip('#')
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def gradient_map(lum, stops):
    # lum va de 0 a 1; stops es [(posición, '#color'), …].
    xs = [p for p, _ in stops]
    out = np.zeros(lum.shape + (3,), dtype=np.float32)
    for channel in range(3):
        out[..., channel] = np.interp(lum, xs, [hexrgb(c)[channel] for _, c in stops])
    return out


def to_lum(im):
    return np.asarray(im.convert('L'), dtype=np.float32) / 255


def stretch(lum, low=2, high=98):
    a, b = np.percentile(lum, [low, high])
    return np.clip((lum - a) / (b - a), 0, 1)


def save(array_or_image, name, quality=84):
    im = array_or_image if isinstance(array_or_image, Image.Image) else Image.fromarray(np.uint8(np.clip(array_or_image, 0, 255)))
    im.save(f'{OUT}/{name}.webp', quality=quality, method=6)


# --- Sobre metálico: se recorta del fondo negro con un relleno desde las esquinas.
foil = Image.open(f'{CODEX}/codex-sobre-foil.png').convert('RGB')
W, H = foil.size
gray = np.asarray(foil.convert('L').filter(ImageFilter.GaussianBlur(1)), dtype=np.float32)
bright = gray > 21
MAX_Y = 1484
lefts, rights = np.full(H, W), np.full(H, -1)
for y in range(H):
    # Una racha de 8 píxeles evita que una mota del fondo cuente como borde.
    run = np.convolve(bright[y].astype(np.int32), np.ones(8, dtype=np.int32), 'same') >= 8
    hits = np.flatnonzero(run)
    if hits.size and y <= MAX_Y:
        lefts[y], rights[y] = hits[0], hits[-1]
window = 11
smooth_l = np.array([np.median(lefts[max(0, y - window):y + window]) for y in range(H)])
smooth_r = np.array([np.median(rights[max(0, y - window):y + window]) for y in range(H)])
# En el cuerpo el borde se confunde con el fondo en las zonas oscuras: se ajusta una curva suave.
body = np.arange(135, 1345)


def fit_edge(values, outward):
    keep = np.ones(body.size, dtype=bool)
    for _ in range(6):
        curve = np.polyval(np.polyfit(body[keep], values[keep], 3), body)
        keep = (values - curve) * outward > -4
    return curve


smooth_l[body] = fit_edge(smooth_l[body], -1)
smooth_r[body] = fit_edge(smooth_r[body], 1)
tops, bottoms = np.full(W, H), np.full(W, -1)
for x in range(W):
    hits = np.flatnonzero(bright[:MAX_Y + 1, x])
    if hits.size:
        tops[x], bottoms[x] = hits[0], hits[-1]
tops = np.array([tops[max(0, x - 7):x + 8].min() for x in range(W)])
bottoms = np.array([bottoms[max(0, x - 7):x + 8].max() for x in range(W)])
yy, xx = np.mgrid[0:H, 0:W]
inside = (xx >= smooth_l[yy]) & (xx <= smooth_r[yy]) & (yy >= tops[xx]) & (yy <= bottoms[xx])
mask = Image.fromarray(np.uint8(inside) * 255).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
box = mask.point(lambda v: 255 if v > 128 else 0).getbbox()
print('sobre', box)
PACK = (700, round(700 * (box[3] - box[1]) / (box[2] - box[0])))
pack_rgb = foil.crop(box).resize(PACK, Image.LANCZOS)
pack_mask = mask.crop(box).resize(PACK, Image.LANCZOS)
nasca = pack_rgb.copy()
nasca.putalpha(pack_mask)
save(nasca, 'sobre-nasca', 88)

# Sombreado del metal: pliegues de la zona lisa de arriba, reflejados abajo; entre medio, solo los bordes.
lum = to_lum(pack_rgb)
ph, pw = lum.shape
crimp = int(ph * 0.078)
calm_end = int(ph * 0.27)
shade = lum.copy()
band = np.median(lum[crimp + 40:calm_end], axis=0)
low_start = ph - crimp - (calm_end - crimp)
for y in range(calm_end, ph - crimp):
    shade[y] = lum[crimp + (ph - crimp - 1 - y)] if y >= low_start else band
base = np.median(lum[crimp + 40:calm_end])
shade_small = np.asarray(Image.fromarray(np.uint8(shade * 255)).filter(ImageFilter.GaussianBlur(1.2)), dtype=np.float32) / 255
ratio = np.clip(shade_small / max(base, 1e-3), 0.45, 1.9)[..., None]


def repack(path, name, cy=0.5):
    art = np.asarray(cover(Image.open(path).convert('RGB'), PACK, cy), dtype=np.float32)
    lit = art * np.minimum(ratio, 1.1) + np.maximum(ratio - 1.1, 0) * 70
    # Las soldaduras se oscurecen un poco para que se lean como metal prensado.
    lit[:crimp] *= 0.9
    lit[ph - crimp:] *= 0.9
    im = Image.fromarray(np.uint8(np.clip(lit, 0, 255)))
    im.putalpha(pack_mask)
    save(im, name, 88)


repack(f'{CODEX}/codex-sobre-arte.png', 'sobre-pelicanos', 0.5)
repack(f'{GEMINI}sobre-paracas.png', 'sobre-paracas', 0.6)

# --- Paisajes de hábitat, a la proporción de la carta.
for hab in ['litoral', 'humedales', 'desierto', 'sierra', 'mar']:
    save(cover(Image.open(f'{GEMINI}fondo-{hab}.png').convert('RGB'), CARD, 0.6), f'escena-{hab}', 82)

# --- Dorso.
save(cover(Image.open(f'{CODEX}/codex-dorso.png').convert('RGB'), CARD), 'dorso', 84)

# --- Metales: el relieve de oro de Codex se lleva a cada material con un mapa de gradiente.
oro = cover(Image.open(f'{CODEX}/codex-oro.png').convert('RGB'), CARD)
oro_lum = stretch(to_lum(oro))
save(oro, 'marco-oro', 82)
save(gradient_map(oro_lum, [(0, '#39424A'), (0.45, '#95A1AB'), (0.78, '#DDE3E8'), (1, '#FFFFFF')]), 'marco-plata', 82)
save(gradient_map(oro_lum, [(0, '#2E0610'), (0.45, '#8C1730'), (0.78, '#D24A60'), (1, '#FFC9D1')]), 'marco-rubi', 82)

height, width = oro_lum.shape
yy, xx = np.mgrid[0:height, 0:width]
diagonal = ((xx / width + yy / height) * 1.1) % 1
iridescent = np.zeros((height, width, 3), dtype=np.float32)
for y in range(0, height):
    row = diagonal[y]
    iridescent[y] = np.array([colorsys.hsv_to_rgb(h, 0.22, 1) for h in row], dtype=np.float32) * 255
ice = gradient_map(oro_lum, [(0, '#6C93AC'), (0.5, '#C6E2F0'), (0.82, '#F4FBFF'), (1, '#FFFFFF')])
save(ice * 0.55 + iridescent * 0.45 * (0.35 + 0.65 * oro_lum[..., None]) + 60 * (1 - oro_lum[..., None]) * 0, 'marco-diamante', 82)

relieve = Image.open(f'{CODEX}/codex-relieve.png').convert('L')
tile = relieve.resize((720, 720), Image.LANCZOS)
sheet = Image.new('L', CARD)
for y in range(0, CARD[1], 720):
    sheet.paste(tile, (0, y))
rel_lum = stretch(np.asarray(sheet, dtype=np.float32) / 255)
HABS = {
    'litoral': ('#123F4B', '#3D858D', '#7FBAC0'),
    'humedales': ('#2B4A1E', '#678C3D', '#A4C27F'),
    'desierto': ('#5E4216', '#B89042', '#E2C88E'),
    'sierra': ('#3C3358', '#857599', '#BDB1CE'),
    'mar': ('#16324A', '#3F6880', '#86A9BE'),
}
for hab, (dark, mid, light) in HABS.items():
    save(gradient_map(rel_lum, [(0, dark), (0.5, mid), (1, light)]), f'marco-{hab}', 80)

rainbow = np.zeros(CARD[::-1] + (3,), dtype=np.float32)
yy, xx = np.mgrid[0:CARD[1], 0:CARD[0]]
hue = ((xx / CARD[0] + yy / CARD[1]) * 0.9) % 1
for y in range(CARD[1]):
    rainbow[y] = np.array([colorsys.hsv_to_rgb(h, 0.3, 1) for h in hue[y]], dtype=np.float32) * 255
save(rainbow * (0.62 + 0.38 * rel_lum[..., None]), 'marco-cromado', 80)

# Máscara del brillo: la luz solo corre por el relieve.
blurred = np.asarray(sheet.filter(ImageFilter.GaussianBlur(10)), dtype=np.float32) / 255
detail = np.clip(np.abs(np.asarray(sheet, dtype=np.float32) / 255 - blurred) * 5, 0, 1)
alpha = Image.fromarray(np.uint8(detail * 255))
glint = Image.new('RGBA', CARD, (255, 255, 255, 0))
glint.putalpha(alpha)
save(glint, 'brillo-mascara', 70)

# --- Hoja de control.
names = ['sobre-nasca', 'sobre-pelicanos', 'sobre-paracas', 'dorso', 'marco-cromado', 'marco-plata', 'marco-oro', 'marco-rubi', 'marco-diamante', 'marco-litoral', 'marco-sierra', 'brillo-mascara']
tw, th = 240, 336
board = Image.new('RGB', (tw * 6 + 50, th * 2 + 10), '#7A7A7A')
for i, name in enumerate(names):
    im = Image.open(f'{OUT}/{name}.webp').convert('RGBA').resize((tw, th))
    board.paste(im, ((i % 6) * (tw + 10), (i // 6) * (th + 10)), im)
board.convert('RGB').save(f'{RAW}/control.jpg', quality=86)
print(board.size)
