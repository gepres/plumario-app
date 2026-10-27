# Quita el fondo plano de las ilustraciones de la vía B y las deja listas para el sticker: fondo
# transparente, el ave centrada y a 512 × 512.
# Uso (desde la raíz): python tools/stickers/pilot/remove-background.py <entrada.png>… --out <carpeta>
#
# El color del fondo se mide en el borde de la imagen (el modelo no siempre da el tono exacto que se
# le pide). Se quita el fondo que toca el borde y los bolsones del color casi puro que quedan
# encerrados (entre las patas, bajo el pico), sin agujerear un ave que tenga un tono parecido; el
# borde suave se des-mezcla del fondo para que no quede un halo de color.
import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SIZE = 512
FILL = 0.86  # el lado mayor del ave ocupa este tanto del cuadro
SOLID, CLEAR = 50.0, 180.0  # distancia al fondo: por debajo es fondo, por encima es ave
POCKET = 40.0  # un bolsón encerrado se quita solo si es casi el color puro del fondo


def background_color(rgb: np.ndarray) -> np.ndarray:
    border = np.concatenate([rgb[:4].reshape(-1, 3), rgb[-4:].reshape(-1, 3), rgb[:, :4].reshape(-1, 3), rgb[:, -4:].reshape(-1, 3)])
    return np.median(border, axis=0)


def flood(mask: np.ndarray, seeds: np.ndarray) -> np.ndarray:
    """Los píxeles de `mask` a los que se llega desde `seeds` sin salir de `mask`."""
    h, w = mask.shape
    seen = np.zeros_like(mask)
    queue = deque(zip(*np.nonzero(seeds & mask)))
    for y, x in queue:
        seen[y, x] = True
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                queue.append((ny, nx))
    return seen


def process(path: Path, out: Path) -> None:
    image = Image.open(path).convert('RGB')
    if max(image.size) > 1024:
        image = image.resize((1024, 1024), Image.LANCZOS)
    rgb = np.asarray(image, dtype=np.float32)
    bg = background_color(rgb)
    distance = np.linalg.norm(rgb - bg, axis=2)

    # El fondo es lo parecido al color del borde que se une al borde o a un bolsón del color puro.
    border = np.zeros(distance.shape, dtype=bool)
    border[[0, -1], :] = True
    border[:, [0, -1]] = True
    background = flood(distance < CLEAR, border | (distance < POCKET))
    alpha = np.where(background, np.clip((distance - SOLID) / (CLEAR - SOLID), 0, 1), 1.0)

    # Des-mezcla: un píxel del borde es a·ave + (1−a)·fondo.
    a = alpha[..., None]
    color = np.where(a > 0, (rgb - (1 - a) * bg) / np.maximum(a, 1e-3), 0)
    rgba = np.dstack([np.clip(color, 0, 255), alpha * 255]).astype(np.uint8)

    ys, xs = np.nonzero(alpha > 0.5)
    bird = Image.fromarray(rgba, 'RGBA').crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    scale = FILL * SIZE / max(bird.size)
    bird = bird.resize((round(bird.width * scale), round(bird.height * scale)), Image.LANCZOS)
    canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(bird, ((SIZE - bird.width) // 2, (SIZE - bird.height) // 2), bird)
    canvas.save(out / path.name, optimize=True)
    print(f'{path.name}: fondo {tuple(int(c) for c in bg)}, {out / path.name}')


parser = argparse.ArgumentParser()
parser.add_argument('inputs', nargs='+', type=Path)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)
for item in args.inputs:
    process(item, args.out)
