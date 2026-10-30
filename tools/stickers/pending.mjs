// Las aves del álbum que aún no tienen ilustración en data/stickers/raw/, con el color de fondo
// que se le pide al generador (uno que el ave no tenga). Uso (desde la raíz):
//   node tools/stickers/pending.mjs                   → JSON [[id, inglés, científico, fondo], …] por stdout
//   node tools/stickers/pending.mjs --tail 15 --md <archivo>
//                                                     → encargo para Antigravity con las 15 últimas
// Gemini web toma la lista desde el principio y Antigravity desde el final, para no pisarse.
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RAW = join(ROOT, 'data', 'stickers', 'raw');
const KEYS = { green: '#00FF00', magenta: '#FF00FF', blue: '#0000FF' };
const KEY_BY_FAMILY = { Trochilidae: 'blue', Psittacidae: 'magenta', Anatidae: 'magenta', Thraupidae: 'magenta' };
// Especies con verde o rosa en el plumaje fuera de esas familias.
const KEY_BY_SPECIES = {
  'chloroceryle-americana': 'magenta',
  'porphyrio-martinica': 'magenta',
  'tachuris-rubrigastra': 'magenta',
  'plegadis-ridgwayi': 'magenta',
  'colaptes-atricollis': 'magenta',
};

const { values } = parseArgs({ options: { tail: { type: 'string' }, md: { type: 'string' } } });
const catalog = JSON.parse(await readFile(join(ROOT, 'data', 'species', 'ica.json'), 'utf8'));
const pngIds = async (dir) => new Set(existsSync(dir) ? (await readdir(dir)).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, '')) : []);
const done = await pngIds(RAW);
// Las que ya tienen una versión anterior (patas de línea, data/stickers/raw-v1/) se rehacen al final.
const previous = await pngIds(join(ROOT, 'data', 'stickers', 'raw-v1'));
const row = (s) => [s.id, s.englishName, s.scientificName, KEY_BY_SPECIES[s.id] ?? KEY_BY_FAMILY[s.family] ?? 'green'];
const pending = catalog.species.filter((s) => s.taxonClass === catalog.region.albumClass && !done.has(s.id));
const fresh = pending.filter((s) => !previous.has(s.id)).map(row);
const redo = pending.filter((s) => previous.has(s.id)).map(row);
const rows = [...fresh, ...redo];

if (!values.md) {
  process.stdout.write(JSON.stringify(rows));
} else {
  // Antigravity toma desde el final de las nuevas; las de rehacer, solo cuando ya no quedan nuevas.
  const pool = fresh.length ? fresh : redo;
  const tail = pool.slice(-Number(values.tail ?? 15));
  await writeFile(
    values.md,
    `# Ilustraciones de los stickers de Plumario (${tail.length} aves)

Generate ${tail.length} bird illustrations with your built-in image generation tool, one call per
species, and save them in this workspace. Work autonomously until all of them are saved or your
image quota runs out: do not stop to ask for confirmation. Do not edit, create or delete any other file.

## Style reference

Use these two images as the style reference for every illustration:
\`D:\\PROYECTOS\\gepres\\plumario-app\\tools\\stickers\\pilot\\refs\\shorebird.png\` and
\`D:\\PROYECTOS\\gepres\\plumario-app\\tools\\stickers\\pilot\\refs\\oystercatcher.png\`.
They are flat vector bird figures from the app's design. Match their style exactly, but draw the
species asked for, not the birds in the references.

## Prompt for each image

> Create a sticker illustration of a {English name} ({scientific name}), a bird species found in Ica, Peru.
> Draw the adult (the male in breeding plumage if the sexes differ) with the field marks of this exact species: plumage colors and pattern, bill shape and color, leg color and eye.
> Match exactly the illustration style of the two reference images: flat vector shapes in solid colors, no outlines, no gradients, no texture, no shading, only a few simple lighter strokes for feather detail, a round dark eye with a small white highlight.
> Legs and feet: unlike the reference figures, do not draw stick legs. Draw the legs and feet with their real shape for this species, as flat vector shapes in their real color: real thickness, visible toes, webbed feet on waterbirds, strong talons on raptors, short legs where the species has short legs.
> Composition: the full bird in side profile, facing left, standing or perched with nothing under it, centered and filling about 80% of the square.
> Background: one solid flat color, pure {background name} ({background hex}), edge to edge. No ground, no shadow, no branch, no text, no border.

Square images (1:1). The background must be one flat color: it is removed afterwards.

| File name | English name | Scientific name | Background name | Background hex |
|---|---|---|---|---|
${tail.map(([id, en, sci, key]) => `| \`${id}.png\` | ${en} | ${sci} | ${key} | ${KEYS[key]} |`).join('\n')}

## Where to save

Save each image as PNG in \`D:\\PROYECTOS\\gepres\\plumario-app\\data\\stickers\\raw\\\` with the file
name from the table, as soon as it is generated. If your tool saves images somewhere else first,
copy them into that folder.
`,
  );
  console.log(`${tail.length} aves en ${values.md} (${rows.length} pendientes en total)`);
}
