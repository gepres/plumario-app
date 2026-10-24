// Genera visor/index.html desde diseno/: un solo archivo que se abre con doble clic, sin servidor.
// Uso: node herramientas/visor/construir.mjs
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGEN = 'https://claude.ai/code/artifact/b2c44b8d-f350-4ef2-9295-42cf3386f318';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DISENO = join(RAIZ, 'diseno');
const PLANTILLA = join(RAIZ, 'herramientas', 'visor', 'plantilla.html');
const SALIDA = join(RAIZ, 'visor', 'index.html');

const canvas = JSON.parse(await readFile(join(DISENO, 'project', 'canvas.json'), 'utf8'));
const runtime = await readFile(join(DISENO, 'runtime', 'dc-runtime.js'), 'utf8');

// En el canvas las imágenes se piden como /_blob/<id>; aquí van incrustadas como data URI.
const assets = new Map();
for (const f of await readdir(join(DISENO, 'assets'))) {
  if (!f.endsWith('.svg')) continue;
  const base64 = (await readFile(join(DISENO, 'assets', f))).toString('base64');
  assets.set(f.slice(0, -'.svg'.length), `data:image/svg+xml;base64,${base64}`);
}

// Algunos artboards arman la URL en su script (`'/_blob/' + id`): el prefijo entre comillas pasa a
// cadena vacía y el id entre comillas a su data URI, y la suma da el mismo data URI.
const faltantes = new Set();
const archivos = {};
for (const f of (await readdir(join(DISENO, 'project'))).filter((f) => f.endsWith('.dc.html')).sort()) {
  const fuente = await readFile(join(DISENO, 'project', f), 'utf8');
  archivos[f] = fuente
    .replace(/\/_blob\/([0-9a-f]{32})/g, (blob, id) => {
      if (assets.has(id)) return assets.get(id);
      faltantes.add(id);
      return blob;
    })
    .replace(/(['"])\/_blob\/\1/g, '$1$1')
    .replace(/(['"])([0-9a-f]{32})\1/g, (literal, q, id) => (assets.has(id) ? q + assets.get(id) + q : literal));
}

const sinArchivo = Object.keys(canvas.boards).filter((b) => !(b in archivos));
const sinCargador = Object.keys(archivos).filter((f) => !/<script\s+src=["']\.\/support\.js["']\s*><\/script>/i.test(archivos[f]));

// Todo '<' va escapado para que ningún '</script>' de las fuentes cierre la etiqueta de datos.
const datos = JSON.stringify({ origen: ORIGEN, canvas, archivos, runtime }).replace(/</g, '\\u003c');
const html = (await readFile(PLANTILLA, 'utf8')).replace('/*__DATOS__*/', () => datos);

await mkdir(dirname(SALIDA), { recursive: true });
await writeFile(SALIDA, html);

const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log(`${relative(RAIZ, SALIDA)}: ${Object.keys(archivos).length} artboards, ${assets.size} imágenes, ${kb(Buffer.byteLength(html))}`);
for (const id of faltantes) console.error(`falta el asset /_blob/${id}`);
for (const b of sinArchivo) console.error(`canvas.json cita ${b} pero no está en diseno/project`);
for (const f of sinCargador) console.error(`${f} no carga ./support.js: el visor no podrá pintarlo`);
if (faltantes.size || sinArchivo.length || sinCargador.length) process.exitCode = 1;
