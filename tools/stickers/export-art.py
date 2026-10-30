# Lleva las ilustraciones recortadas a la app: un WebP por ave en apps/mobile/assets/stickers/ y el
# mapa por especie en apps/mobile/src/constants/sticker-art.ts. Van dentro del paquete para que se
# vean sin señal. Falla si a un ave del álbum le falta su dibujo.
# Uso (desde la raíz): pnpm stickers:export
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'data' / 'stickers' / 'review' / 'art'
ASSETS = ROOT / 'apps' / 'mobile' / 'assets' / 'stickers'
MAP = ROOT / 'apps' / 'mobile' / 'src' / 'constants' / 'sticker-art.ts'
# Con esta calidad no se distingue del PNG, ni a 3×, y pesa unas 5 veces menos.
QUALITY = 90

catalog = json.loads((ROOT / 'data' / 'species' / 'ica.json').read_text(encoding='utf-8'))
ids = sorted(s['id'] for s in catalog['species'] if s['taxonClass'] == catalog['region']['albumClass'])
missing = [i for i in ids if not (ART / f'{i}.png').exists()]
if missing:
    sys.exit(f'Sin ilustración: {", ".join(missing)}. Corre tools/stickers/build-review.py.')

ASSETS.mkdir(parents=True, exist_ok=True)
for stale in ASSETS.glob('*.webp'):
    stale.unlink()
for i in ids:
    Image.open(ART / f'{i}.png').convert('RGBA').save(ASSETS / f'{i}.webp', 'WEBP', quality=QUALITY, alpha_quality=QUALITY, method=4)

entries = '\n'.join(f"  '{i}': {{ image: require('@/assets/stickers/{i}.webp') }}," for i in ids)
MAP.write_text(
    f"""// GENERADO por tools/stickers/export-art.py — no editar a mano.
import type {{ BirdArt }} from '@plumario/ui';

/** La ilustración de cada ave del álbum, por id de especie; un objeto fijo por ave para no romper el memo del sticker. */
export const STICKER_ART: Readonly<Record<string, BirdArt>> = {{
{entries}
}};
""",
    encoding='utf-8',
    newline='\n',
)
size = sum(f.stat().st_size for f in ASSETS.glob('*.webp'))
print(f'{len(ids)} aves, {size / 1048576:.1f} MB en {ASSETS}')
