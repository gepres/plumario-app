# Galería de revisión de las ilustraciones de los stickers (PA-30): recorta las de
# data/stickers/raw/ que aún no estén recortadas y arma data/stickers/review/index.html, con cada ave
# sobre el color de su hábitat, en el orden del álbum. Se abre con doble clic.
# Uso (desde la raíz): python tools/stickers/build-review.py
import html
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'data' / 'stickers' / 'raw'
REVIEW = ROOT / 'data' / 'stickers' / 'review'
ART = REVIEW / 'art'
# La versión anterior (patas de línea), que se rehace al final: se muestra atenuada mientras tanto.
RAW_V1 = ROOT / 'data' / 'stickers' / 'raw-v1'
ART_V1 = REVIEW / 'art-v1'
# Las correcciones de la revisión final (espejadas, restos de suelo), solo para las de data/stickers/raw/.
CORRECTIONS = ROOT / 'tools' / 'stickers' / 'corrections.json'
# El color de la placa del sticker por hábitat (packages/tokens/src/card-finishes.ts).
TINTS = {'coast': '#D2E4EC', 'wetlands': '#D9EADB', 'desert': '#EADFCB', 'highlands': '#E0DDEA', 'openSea': '#CFDCE8'}
HABITATS = {'coast': 'Litoral', 'wetlands': 'Humedales', 'desert': 'Desierto', 'highlands': 'Sierra', 'openSea': 'Mar abierto'}

def cut_out(source, target, corrections=None):
    target.mkdir(parents=True, exist_ok=True)
    fixes = json.loads(corrections.read_text(encoding='utf-8')) if corrections else {}
    corrected = {*fixes.get('mirror', []), *fixes.get('groundFrom', {})}

    def stale(p):
        art = target / p.name
        if not art.exists() or art.stat().st_mtime < p.stat().st_mtime:
            return True
        return p.stem in corrected and art.stat().st_mtime < corrections.stat().st_mtime

    todo = [p for p in sorted(source.glob('*.png')) if stale(p)]
    if todo:
        script = ROOT / 'tools' / 'stickers' / 'pilot' / 'remove-background.py'
        extra = ['--corrections', str(corrections)] if corrections else []
        subprocess.run([sys.executable, '-I', str(script), *map(str, todo), '--out', str(target), *extra], check=True, stdout=subprocess.DEVNULL)


cut_out(RAW, ART, CORRECTIONS)
if RAW_V1.exists():
    cut_out(RAW_V1, ART_V1)

catalog = json.loads((ROOT / 'data' / 'species' / 'ica.json').read_text(encoding='utf-8'))
birds = sorted((s for s in catalog['species'] if s['taxonClass'] == catalog['region']['albumClass']), key=lambda s: s['albumNumber'])
done = sum(1 for s in birds if (ART / f"{s['id']}.png").exists())

cards = []
for s in birds:
    art = ART / f"{s['id']}.png"
    old = ART_V1 / f"{s['id']}.png"
    tint = TINTS.get(s['habitat'], TINTS['coast'])
    if art.exists():
        figure, state = f'<img src="art/{s["id"]}.png" alt="">', ''
    elif old.exists():
        figure, state = f'<img src="art-v1/{s["id"]}.png" alt=""><em>versión anterior</em>', 'previous'
    else:
        figure, state = '<span class="pending">Pendiente</span>', 'missing'
    cards.append(
        f'<figure style="--tint:{tint}" class="{state}">'
        f'<div class="plate"><b>{s["albumNumber"]:03d}</b>{figure}</div>'
        f'<figcaption>{html.escape(s["commonName"])}<i>{html.escape(s["scientificName"])}</i><small>{HABITATS.get(s["habitat"], "")}</small></figcaption></figure>'
    )

(REVIEW / 'index.html').write_text(f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stickers de Plumario · revisión</title>
<style>
  :root {{ --bg:#F3EDE2; --ink:#14302F; --muted:#5B6B69; }}
  body {{ margin:0; background:var(--bg); color:var(--ink); font:15px/1.4 system-ui, sans-serif; }}
  header {{ padding:24px 16px 8px; max-width:1200px; margin:auto; }}
  h1 {{ margin:0 0 4px; font-size:26px; }}
  header p {{ margin:0; color:var(--muted); }}
  main {{ display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:14px; padding:16px; max-width:1200px; margin:auto; }}
  figure {{ margin:0; background:#fff; border-radius:14px; padding:7px; box-shadow:0 1px 2px rgba(20,48,47,.2), 0 4px 10px rgba(20,48,47,.08); }}
  .plate {{ position:relative; aspect-ratio:1; border-radius:10px; background:var(--tint); display:grid; place-items:center; overflow:hidden; }}
  .plate img {{ width:100%; height:100%; object-fit:contain; }}
  .plate b {{ position:absolute; top:6px; left:6px; font-size:11px; background:#fff; border-radius:99px; padding:1px 7px; }}
  .missing {{ opacity:.55; }}
  .previous img {{ opacity:.45; }}
  .plate em {{ position:absolute; bottom:6px; font-style:normal; font-size:11px; background:#fff; border-radius:99px; padding:1px 8px; color:var(--muted); }}
  .pending {{ color:var(--muted); font-size:13px; }}
  figcaption {{ padding:8px 4px 4px; font-weight:600; font-size:13px; text-align:center; }}
  figcaption i {{ display:block; font-weight:400; color:var(--muted); font-size:12px; }}
  figcaption small {{ display:block; font-weight:400; color:var(--muted); font-size:11px; }}
</style></head>
<body><header><h1>Stickers de Plumario</h1><p>{done} de {len(birds)} aves con ilustración nueva (Gemini, patas con forma), en el orden del álbum y sobre el color de su hábitat. Las atenuadas son la versión anterior, que se rehace al final.</p></header>
<main>{"".join(cards)}</main></body></html>
''', encoding='utf-8')
print(f'{done} de {len(birds)} aves; galería en {REVIEW / "index.html"}')
