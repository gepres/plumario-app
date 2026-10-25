// Genera src/regions/peru-regions.ts con el contorno de cada región del Perú, sacado tal cual de
// design/project/RegionMapa.dc.html (viewBox 330 × 460): su id del diseño, su nombre y su trazo.
// Uso: pnpm --filter @plumario/ui regions.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, '..', '..', '..', 'design', 'project', 'RegionMapa.dc.html');
const OUT = join(HERE, '..', 'src', 'regions', 'peru-regions.ts');

const html = await readFile(SOURCE, 'utf8');

// Los nombres están en el script del componente como un arreglo literal.
const listStart = html.indexOf('const REGIONES = ');
const listEnd = html.indexOf('];', listStart) + 1;
const names = JSON.parse(html.slice(listStart + 'const REGIONES = '.length, listEnd));

const regions = [];
for (const match of html.matchAll(/<path d="([^"]+)" fill="\{\{f\.([A-Z]+)\}\}"/g)) {
  const name = names.find((r) => r.id === match[2])?.nombre;
  if (!name) throw new Error(`Región sin nombre: ${match[2]}`);
  regions.push({ id: match[2], name, d: match[1] });
}
if (regions.length !== names.length) throw new Error(`Se esperaban ${names.length} regiones y hay ${regions.length}`);

const out = `// Generado por scripts/generate-region-map.mjs desde design/project/RegionMapa.dc.html. No editar.

/** Viewbox del mapa de regiones. */
export const PERU_REGIONS_VIEWBOX = { width: 330, height: 460 } as const;

/** Cada región del Perú con el id del diseño (ICA, ARE…), su nombre y su contorno. */
export const PERU_REGIONS: readonly { id: string; name: string; d: string }[] = ${JSON.stringify(regions, null, 2)};
`;
await writeFile(OUT, out);
console.log(`${regions.length} regiones → ${OUT}`);
