// Genera apps/mobile/src/constants/card-facts.ts, los textos y medidas que imprime cada carta. Van
// dentro del paquete, como las ilustraciones, para que la carta se lea sin señal.
// Uso: pnpm species:cards (desde la raíz), después de editar data/species/ica-families.json o de
// correr pnpm species:measures.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = async (...path) => JSON.parse(await readFile(join(ROOT, ...path), 'utf8'));
const TARGET = join(ROOT, 'apps', 'mobile', 'src', 'constants', 'card-facts.ts');

// Lo que cabe en la carta sin cambiar de tamaño de letra.
const MAX_TITLE = 26;
const MAX_TEXT = 90;

const [catalog, { families, reviewed }, measures] = await Promise.all([
  read('data', 'species', 'ica.json'),
  read('data', 'species', 'ica-families.json'),
  read('data', 'species', 'ica-measures.json'),
]);
const album = catalog.species.filter((s) => s.albumNumber !== null);

const problems = [];
const familiesInAlbum = [...new Set(album.map((s) => s.family))].sort();
for (const family of familiesInAlbum) if (!families[family]) problems.push(`Falta la familia ${family}`);
for (const family of Object.keys(families)) if (!familiesInAlbum.includes(family)) problems.push(`Sobra la familia ${family}`);
for (const [family, { traits }] of Object.entries(families)) {
  if (traits.length !== 2) problems.push(`${family} debe tener 2 rasgos`);
  for (const [title, text] of traits) {
    if (title.length > MAX_TITLE) problems.push(`${family}: título largo «${title}»`);
    if (text.length > MAX_TEXT) problems.push(`${family}: texto largo «${text}»`);
  }
}
for (const s of album) {
  const seals = [s.threatened || ['NT'].includes(s.iucn) || s.nationalCategory === 'NT', s.endemic, s.emblematic].filter(Boolean).length;
  if (seals > 2) problems.push(`${s.commonName} lleva más de 2 sellos: la carta solo tiene sitio para 2`);
}
if (problems.length) throw new Error(problems.join('\n'));

const familyLines = Object.keys(families)
  .sort()
  .map((family) => {
    const { label, diet, traits } = families[family];
    return `  ${JSON.stringify(family)}: { label: ${JSON.stringify(label)}, diet: ${JSON.stringify(diet)}, traits: [${traits
      .map(([title, text]) => `{ title: ${JSON.stringify(title)}, text: ${JSON.stringify(text)} }`)
      .join(', ')}] },`;
  });
const measureLines = Object.entries(measures.species)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([id, { massG, wingMm }]) => `  ${JSON.stringify(id)}: { massG: ${massG}, wingMm: ${wingMm} },`);

await writeFile(
  TARGET,
  `// GENERADO por tools/species/card-facts.mjs — no editar a mano.
// Familias: data/species/ica-families.json. Medidas: AVONET (Tobias et al. 2022, CC BY 4.0).

export type FamilyFacts = { label: string; diet: string; traits: readonly { title: string; text: string }[] };
export type SpeciesMeasures = { massG: number; wingMm: number };

/** Mientras sea false, los textos son un borrador sin la revisión del biólogo. */
export const CARD_FACTS_REVIEWED = ${reviewed && measures.reviewed};

/** Nombre, dieta y rasgos de cada familia del álbum, por nombre científico de la familia. */
export const FAMILY_FACTS: Readonly<Record<string, FamilyFacts>> = {
${familyLines.join('\n')}
};

/** Peso y ala de cada ave, por id de especie. */
export const SPECIES_MEASURES: Readonly<Record<string, SpeciesMeasures>> = {
${measureLines.join('\n')}
};
`,
);
console.log(`${familyLines.length} familias y ${measureLines.length} aves con medidas en ${TARGET}.`);
