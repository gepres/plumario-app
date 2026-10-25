// Genera src/figures/figure-svgs.ts con las 24 figuras de aves del diseño (design/assets), una por
// grupo de SistemaSiluetas.dc.html. Uso: pnpm --filter @plumario/ui figures.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, '..', '..', '..', 'design', 'assets');
const OUT = join(HERE, '..', 'src', 'figures', 'figure-svgs.ts');

// Grupo (las claves de FIGURES en @plumario/core) → imagen del canvas, en el orden del diseño.
const GROUPS = {
  songbird: ['Pájaro', 'bd33d7ef45c2158cdd8113e62ee29b1f'],
  shorebird: ['Playero', '700e5a92d8dae9ed43cb6af87296da4a'],
  seabird: ['Ave marina', '2b893819fa418d69436c6fc4cbcb458d'],
  gull: ['Gaviota', '95828bd5b7fe0dda93d787c2e178af86'],
  swallow: ['Golondrina', 'dd47676ec4b8dac0070c427770484a02'],
  tern: ['Gaviotín', '4872b8efc92794f43c266dd9d5443ff9'],
  duck: ['Pato', 'a502131de354f9ff111cefd6fc3bf5f7'],
  heron: ['Garza', 'd2e03e73fd6b3ebda1ddb6b5afcc6dbb'],
  raptor: ['Rapaz', '628e046e3078c302a31829e5497b15eb'],
  dove: ['Paloma', '53239f140a3d5f5fbee940ee877cf0f4'],
  hummingbird: ['Colibrí', '3bf57018dbc1bb9858f8771245a61246'],
  owl: ['Lechuza', '380612587e53c68fbb5b4ef6dac14ce7'],
  coot: ['Gallareta', '413db6bc5ae615df7234f1ea3e58ad54'],
  booby: ['Piquero', '48f636337e470379dd8bdaa2851aa67e'],
  grebe: ['Zambullidor', '28eb48ed7ad693b999617c0a4092f292'],
  cormorant: ['Cormorán', '324eb365f7661bc4b510461415b5d31f'],
  flamingo: ['Flamenco', '134f420a8833e17a10978048f13b57fd'],
  vulture: ['Gallinazo', 'be5f9b84baa8bc6c9ae1858d2b36e745'],
  parrot: ['Loro', 'f06f9bb6899166065ffde5bc687c308c'],
  tinamou: ['Perdiz', '4d15a0df0cb76874cf395a7310506358'],
  oystercatcher: ['Ostrero', 'ad333582f63fc034b5502953c14b64de'],
  stilt: ['Cigüeñuela', '6296ffe1eefbe10536c55645e57fd551'],
  penguin: ['Pingüino', '5fc0580c91c07a04c8b7ce42a3c9a6d2'],
  pelican: ['Pelícano', '92d0b07d7a6b9d699e834111a098ce4a'],
};

const minify = (svg) => svg.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();

const lines = [];
for (const [key, [label, id]] of Object.entries(GROUPS)) {
  const svg = minify(await readFile(join(ASSETS, `${id}.svg`), 'utf8'));
  if (!svg.startsWith('<svg')) throw new Error(`${id}.svg no es un SVG`);
  lines.push(`  // ${label}\n  ${key}: ${JSON.stringify(svg)},`);
}

await writeFile(
  OUT,
  `// GENERADO por scripts/generate-figures.mjs desde design/assets — no editar a mano.
// Las 24 figuras de SistemaSiluetas.dc.html (viewBox 240 × 240), por grupo.

export const FIGURE_SVGS = {
${lines.join('\n')}
} as const;

export type FigureName = keyof typeof FIGURE_SVGS;
`,
);
console.log(`${Object.keys(GROUPS).length} figuras en ${OUT}`);
