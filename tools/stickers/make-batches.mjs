// Arma los encargos de ilustraciones de los stickers (PA-30): una tanda de 25 aves por archivo en
// tools/stickers/batches/, con el mismo encargo que ganó en el piloto (Gemini en Antigravity).
// Deja fuera las especies que ya tienen ilustración en data/stickers/raw/.
// Uso (desde la raíz): node tools/stickers/make-batches.mjs
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'tools', 'stickers', 'batches');
const RAW = join(ROOT, 'data', 'stickers', 'raw');
const BATCH_SIZE = 25;

// El fondo plano que se quita después: un color que el ave no tenga.
const KEYS = { green: '#00FF00', magenta: '#FF00FF', blue: '#0000FF' };
const KEY_BY_FAMILY = {
  Trochilidae: 'blue', // verdes con gorgueras magenta
  Psittacidae: 'magenta',
  Anatidae: 'magenta', // espejos verdes en el ala
  Thraupidae: 'magenta',
};

const catalog = JSON.parse(await readFile(join(ROOT, 'data', 'species', 'ica.json'), 'utf8'));
const done = new Set(existsSync(RAW) ? (await readdir(RAW)).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, '')) : []);
const pending = catalog.species.filter((s) => s.taxonClass === catalog.region.albumClass && !done.has(s.id));

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const row = (s) => {
  const key = KEY_BY_FAMILY[s.family] ?? 'green';
  return `| \`${s.id}.png\` | ${s.englishName} | ${s.scientificName} | ${key} | ${KEYS[key]} |`;
};

const batches = [];
for (let i = 0; i < pending.length; i += BATCH_SIZE) batches.push(pending.slice(i, i + BATCH_SIZE));
for (const [i, species] of batches.entries()) {
  const name = `batch-${String(i + 1).padStart(2, '0')}`;
  await writeFile(
    join(OUT, `${name}.md`),
    `# Ilustraciones de los stickers de Plumario · ${name} (${species.length} aves)

Generate ${species.length} bird illustrations with your built-in image generation tool, one call per
species, and save them in this workspace. Work autonomously until all of them are saved: do not
stop to ask for confirmation. Do not edit, create or delete any other file.

## Style reference

Use these two images as the style reference for every illustration:
\`D:\\PROYECTOS\\gepres\\plumario-app\\tools\\stickers\\pilot\\refs\\shorebird.png\` and
\`D:\\PROYECTOS\\gepres\\plumario-app\\tools\\stickers\\pilot\\refs\\oystercatcher.png\`.
They are flat vector bird figures from the app's design. Match their style exactly, but draw the
species asked for, not the birds in the references.

## Prompt for each image

> Create a sticker illustration of a {English name} ({scientific name}), a bird species found in Ica, Peru.
> Draw the adult (the male in breeding plumage if the sexes differ) with the field marks of this exact species: plumage colors and pattern, bill shape and color, leg color and eye.
> Match exactly the illustration style of the two reference images: flat vector shapes in solid colors, no outlines, no gradients, no texture, no shading, only a few simple lighter strokes for feather detail, a round dark eye with a small white highlight, legs as simple thick lines with short line feet.
> Composition: the full bird in side profile, facing left, standing or perched with nothing under it, centered and filling about 80% of the square.
> Background: one solid flat color, pure {background name} ({background hex}), edge to edge. No ground, no shadow, no branch, no text, no border.

Square images (1:1). The background must be one flat color: it is removed afterwards.

| File name | English name | Scientific name | Background name | Background hex |
|---|---|---|---|---|
${species.map(row).join('\n')}

## Where to save

Save each image as PNG in \`D:\\PROYECTOS\\gepres\\plumario-app\\data\\stickers\\raw\\\` with the file
name from the table. If your tool saves images somewhere else first, copy them into that folder.
When all are saved, create \`${name}.done.txt\` in that folder listing the files and the image model.
`,
  );
}
console.log(`${pending.length} aves pendientes (${done.size} ya hechas) en ${batches.length} tandas: tools/stickers/batches/`);
