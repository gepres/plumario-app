// Genera viewer/index.html desde design/: un solo archivo que se abre con doble clic, sin servidor.
// Uso: pnpm viewer (desde la raíz).
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://claude.ai/code/artifact/b2c44b8d-f350-4ef2-9295-42cf3386f318';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DESIGN = join(ROOT, 'design');
const TEMPLATE = join(ROOT, 'tools', 'viewer', 'template.html');
const OUTPUT = join(ROOT, 'viewer', 'index.html');

const canvas = JSON.parse(await readFile(join(DESIGN, 'project', 'canvas.json'), 'utf8'));
const runtime = await readFile(join(DESIGN, 'runtime', 'dc-runtime.js'), 'utf8');

// En el canvas las imágenes se piden como /_blob/<id>; aquí van incrustadas como data URI.
const assets = new Map();
for (const f of await readdir(join(DESIGN, 'assets'))) {
  if (!f.endsWith('.svg')) continue;
  const base64 = (await readFile(join(DESIGN, 'assets', f))).toString('base64');
  assets.set(f.slice(0, -'.svg'.length), `data:image/svg+xml;base64,${base64}`);
}

// Algunos artboards arman la URL en su script (`'/_blob/' + id`): el prefijo entre comillas pasa a
// cadena vacía y el id entre comillas a su data URI, y la suma da el mismo data URI.
const missingAssets = new Set();
const files = {};
for (const f of (await readdir(join(DESIGN, 'project'))).filter((f) => f.endsWith('.dc.html')).sort()) {
  const source = await readFile(join(DESIGN, 'project', f), 'utf8');
  files[f] = source
    .replace(/\/_blob\/([0-9a-f]{32})/g, (blob, id) => {
      if (assets.has(id)) return assets.get(id);
      missingAssets.add(id);
      return blob;
    })
    .replace(/(['"])\/_blob\/\1/g, '$1$1')
    .replace(/(['"])([0-9a-f]{32})\1/g, (literal, q, id) => (assets.has(id) ? q + assets.get(id) + q : literal));
}

const boardsWithoutFile = Object.keys(canvas.boards).filter((b) => !(b in files));
const filesWithoutLoader = Object.keys(files).filter((f) => !/<script\s+src=["']\.\/support\.js["']\s*><\/script>/i.test(files[f]));

// Todo '<' va escapado para que ningún '</script>' de las fuentes cierre la etiqueta de datos.
// Contrato con template.html: el marcador /*__DATA__*/ recibe { origin, canvas, files, runtime }.
const data = JSON.stringify({ origin: ORIGIN, canvas, files, runtime }).replace(/</g, '\\u003c');
const html = (await readFile(TEMPLATE, 'utf8')).replace('/*__DATA__*/', () => data);

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, html);

const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log(`${relative(ROOT, OUTPUT)}: ${Object.keys(files).length} artboards, ${assets.size} imágenes, ${kb(Buffer.byteLength(html))}`);
for (const id of missingAssets) console.error(`falta el asset /_blob/${id}`);
for (const b of boardsWithoutFile) console.error(`canvas.json cita ${b} pero no está en design/project`);
for (const f of filesWithoutLoader) console.error(`${f} no carga ./support.js: el visor no podrá pintarlo`);
if (missingAssets.size || boardsWithoutFile.length || filesWithoutLoader.length) process.exitCode = 1;
