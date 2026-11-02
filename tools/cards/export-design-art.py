# Lleva el arte de las cartas a design/assets/ en un tamaño liviano, para que los artboards lo usen como
# /_blob/<id> y el visor siga abriendo con doble clic. Uso, desde la raíz: python tools/cards/export-design-art.py
# Deja en design/assets/cards.json qué id tiene cada pieza.
import hashlib
import json
import os
from io import BytesIO

from PIL import Image

CARDS = 'apps/mobile/assets/cards'
STICKERS = 'apps/mobile/assets/stickers'
OUT = 'design/assets'
INDEX = f'{OUT}/cards.json'

# La carta se ve a 400 px como mucho en los artboards.
CARD = (450, 630)
SEAL = (156, 156)
BIRD = (356, 356)
PIECES = [f'marco-{n}' for n in ['litoral', 'humedales', 'desierto', 'sierra', 'mar', 'cromado', 'plata', 'oro', 'rubi', 'diamante']]
PIECES += [f'escena-{n}' for n in ['litoral', 'humedales', 'desierto', 'sierra', 'mar']]
PIECES += ['dorso', 'brillo-mascara']
SEALS = [f'sello-{n}' for n in ['amenazada', 'casi', 'endemica', 'emblematica']]
PACKS = [f'sobre-{n}' for n in ['nasca', 'pelicanos', 'paracas']]
BIRDS = [
    'pelecanus-thagus', 'phoenicopterus-chilensis', 'athene-cunicularia', 'vultur-gryphus', 'thalassarche-melanophris',
    'cinclodes-taczanowskii', 'anarhynchus-nivosus', 'larus-belcheri', 'calidris-alba', 'geositta-peruviana',
]


def export(path, size, quality):
    im = Image.open(path)
    im = im.convert('RGBA' if im.mode == 'RGBA' else 'RGB').resize(size, Image.LANCZOS)
    buffer = BytesIO()
    im.save(buffer, 'webp', quality=quality, method=6)
    data = buffer.getvalue()
    asset = hashlib.md5(data).hexdigest()
    with open(f'{OUT}/{asset}.webp', 'wb') as out:
        out.write(data)
    return asset, len(data)


old = json.load(open(INDEX, encoding='utf-8')) if os.path.exists(INDEX) else {}
index, total = {}, 0
for names, folder, sized, quality in [
    (PIECES, CARDS, lambda _: CARD, 72),
    (SEALS, CARDS, lambda _: SEAL, 82),
    (PACKS, CARDS, lambda s: (450, round(450 * s[1] / s[0])), 80),
    (BIRDS, STICKERS, lambda _: BIRD, 80),
]:
    for name in names:
        path = f'{folder}/{name}.webp'
        index[name], size = export(path, sized(Image.open(path).size), quality)
        total += size

for name, asset in old.items():
    if asset not in index.values() and os.path.exists(f'{OUT}/{asset}.webp'):
        os.remove(f'{OUT}/{asset}.webp')
with open(INDEX, 'w', encoding='utf-8') as out:
    json.dump(index, out, indent=2)
    out.write('\n')
print(f'{len(index)} piezas en {OUT}: {total // 1024} KB')
