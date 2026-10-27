// Arma apps/mobile/src/screens/sticker-pilot/pilot-data.ts para la pantalla del piloto: las
// especies (del catálogo), sus dibujos de la vía A (tools/stickers/pilot/a/<id>.svg) y las
// ilustraciones de las vías B y C que haya (apps/mobile/assets/sticker-pilot/<carpeta>/<id>.png).
// También escribe tools/stickers/pilot/share/__forms.html, el esqueleto del formulario de
// opiniones que Netlify necesita para registrar los campos que manda la pantalla.
// Uso (desde la raíz): node tools/stickers/pilot/build-pilot-data.mjs
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const IDS = [
  'pyrocephalus-rubinus', 'phoenicopterus-chilensis', 'pelecanus-thagus', 'rhodopis-vesper', 'quechuavis-decussata', 'geositta-peruviana',
  'larosterna-inca', 'vultur-gryphus', 'phalacrocorax-bougainvillii', 'falco-sparverius', 'columbina-cruziana', 'zonotrichia-capensis',
];
// Carpeta de las ilustraciones ya recortadas, letra de la vía y con qué se hizo.
const MODELS = [
  ['antigravity', 'B', 'Gemini'],
  ['codex', 'C', 'ChatGPT'],
];
// El formulario de Netlify que recibe las opiniones (pantalla y esqueleto usan el mismo nombre).
const FORM_NAME = 'opinion-stickers';

const catalog = JSON.parse(await readFile(join(ROOT, 'data', 'species', 'ica.json'), 'utf8'));
const minify = (svg) => svg.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();

const entries = [];
for (const id of IDS) {
  const s = catalog.species.find((x) => x.id === id);
  const svg = minify(await readFile(join(ROOT, 'tools', 'stickers', 'pilot', 'a', `${id}.svg`), 'utf8'));
  const images = MODELS.map(([model]) => `apps/mobile/assets/sticker-pilot/${model}/${id}.png`).map((path) =>
    existsSync(join(ROOT, path)) ? `require('${path.replace('apps/mobile/', '@/')}')` : 'null',
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

export const FORM_NAME = '${FORM_NAME}';

export const ILLUSTRATION_MODELS = ${JSON.stringify(MODELS.map(([, letter, label]) => ({ letter, label })))} as const;

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
  /** Vías B y C: la ilustración de cada una, o null si aún no se generó. */
  illustrations: (ImageSourcePropType | null)[];
}[] = [
${entries.join('\n')}
];
`,
);

await writeFile(
  join(ROOT, 'tools', 'stickers', 'pilot', 'share', '__forms.html'),
  `<!doctype html>
<!-- GENERADO por tools/stickers/pilot/build-pilot-data.mjs: el formulario de opiniones, para que Netlify lo detecte. -->
<html lang="es">
<body>
<form name="${FORM_NAME}" data-netlify="true" netlify-honeypot="bot-field" hidden>
  <input type="hidden" name="form-name" value="${FORM_NAME}" />
  <input type="text" name="nombre" />
  <textarea name="comentario"></textarea>
${IDS.map((id) => `  <input type="text" name="${id}" />`).join('\n')}
  <input name="bot-field" />
</form>
</body>
</html>
`,
);
console.log(`pilot-data.ts y share/__forms.html: ${IDS.length} especies`);
