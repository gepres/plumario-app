// Arma apps/mobile/src/screens/sticker-pilot/pilot-data.ts para la pantalla del piloto: las 6
// especies (del catálogo), sus dibujos de la vía A (tools/stickers/pilot/a/<id>.svg) y las
// ilustraciones de la vía B que haya (apps/mobile/assets/sticker-pilot/<modelo>/<id>.png).
// Uso (desde la raíz): node tools/stickers/pilot/build-pilot-data.mjs
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const IDS = ['pyrocephalus-rubinus', 'phoenicopterus-chilensis', 'pelecanus-thagus', 'rhodopis-vesper', 'quechuavis-decussata', 'geositta-peruviana'];
export const MODELS = [
  ['antigravity', 'Gemini (Antigravity)'],
];

const catalog = JSON.parse(await readFile(join(ROOT, 'data', 'species', 'ica.json'), 'utf8'));
const minify = (svg) => svg.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();

const entries = [];
for (const id of IDS) {
  const s = catalog.species.find((x) => x.id === id);
  const svg = minify(await readFile(join(ROOT, 'tools', 'stickers', 'pilot', 'a', `${id}.svg`), 'utf8'));
  const images = MODELS.map(([model]) => `apps/mobile/assets/sticker-pilot/${model}/${id}.png`).map((path) =>
    existsSync(join(ROOT, path)) ? `require('../../../${path.replace('apps/mobile/', '')}')` : 'null',
  );
  entries.push(`  {
    id: '${id}',
    commonName: ${JSON.stringify(s.commonName)},
    scientificName: ${JSON.stringify(s.scientificName)},
    albumNumber: ${s.albumNumber},
    habitat: '${s.habitat}',
    family: '${s.family}',
    genus: '${s.genus}',
    iucn: ${JSON.stringify(s.iucn)},
    endemic: ${s.endemic},
    emblematic: ${s.emblematic},
    vector: ${JSON.stringify(svg)},
    illustrations: [${images.join(', ')}],
  },`);
}

await writeFile(
  join(ROOT, 'apps', 'mobile', 'src', 'screens', 'sticker-pilot', 'pilot-data.ts'),
  `// GENERADO por tools/stickers/pilot/build-pilot-data.mjs — no editar a mano.
import type { ImageSourcePropType } from 'react-native';

export const ILLUSTRATION_MODELS = ${JSON.stringify(MODELS.map(([, label]) => label))} as const;

export const PILOT_SPECIES: {
  id: string;
  commonName: string;
  scientificName: string;
  albumNumber: number;
  habitat: 'coast' | 'wetlands' | 'desert' | 'highlands' | 'openSea';
  family: string;
  genus: string;
  iucn: string | null;
  endemic: boolean;
  emblematic: boolean;
  /** Vía A: el dibujo vectorial. */
  vector: string;
  /** Vía B: la ilustración de cada modelo, o null si aún no se generó. */
  illustrations: (ImageSourcePropType | null)[];
}[] = [
${entries.join('\n')}
];
`,
);
console.log(`pilot-data.ts: ${IDS.length} especies`);
