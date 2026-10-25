// Genera src/posters/poster-scenes.ts con los paisajes del póster por hábitat, sacados tal cual de
// design/project/PosterHabitat.dc.html: el SVG de cada hábitat (con sus colores como {{p.clave}}) y
// las paletas clara y oscura. Uso: pnpm --filter @plumario/ui posters.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, '..', '..', '..', 'design', 'project', 'PosterHabitat.dc.html');
const OUT = join(HERE, '..', 'src', 'posters', 'poster-scenes.ts');

// Clave del diseño → hábitat del núcleo.
const HABITATS = { LIT: 'coast', HUM: 'wetlands', DES: 'desert', AND: 'highlands', PEL: 'openSea' };

const html = await readFile(SOURCE, 'utf8');

const scenes = {};
for (const match of html.matchAll(/<sc-if value="\{\{is(LIT|HUM|DES|AND|PEL)\}\}"[^>]*>\s*(<svg[\s\S]*?<\/svg>)\s*<\/sc-if>/g)) {
  const svg = match[2]
    .replace(/\s*aria-hidden="true"/g, '')
    .replace(/\s*style="[^"]*"/g, '')
    .replace(/>\s+</g, '><')
    .trim();
  scenes[HABITATS[match[1]]] = svg;
}
if (Object.keys(scenes).length !== 5) throw new Error(`Se esperaban 5 paisajes y hay ${Object.keys(scenes).length}`);

// Las paletas están en el script del componente como un objeto literal: se evalúa solo esa parte.
const palStart = html.indexOf('const PAL = {');
const palEnd = html.indexOf('};', palStart) + 2;
if (palStart < 0) throw new Error('No encontré las paletas (const PAL)');
const PAL = new Function(`${html.slice(palStart, palEnd)}; return PAL;`)();
const palettes = {};
for (const [key, habitat] of Object.entries(HABITATS)) palettes[habitat] = { light: PAL[key].claro, dark: PAL[key].oscuro };

// Lo demás de cada hábitat (columnas, si lleva nombres, tinte y color de acento), de CFG.
const cfgStart = html.indexOf('const CFG = {');
const cfgEnd = html.indexOf('};', cfgStart) + 2;
const CFG = new Function(`${html.slice(cfgStart, cfgEnd)}; return CFG;`)();
const layout = {};
for (const [key, habitat] of Object.entries(HABITATS)) {
  const c = CFG[key];
  layout[habitat] = { columns: c.cols, names: c.names, accent: { light: c.claro, dark: c.oscuro } };
}

await writeFile(
  OUT,
  `// GENERADO por scripts/generate-poster-scenes.mjs desde design/project/PosterHabitat.dc.html — no editar a mano.
// El paisaje de fondo de cada póster de hábitat (1123 × 1587), con sus colores como {{p.clave}}, y
// las paletas clara y oscura con que se rellenan.

export const POSTER_SCENES = ${JSON.stringify(scenes, null, 2)} as const;

export const POSTER_PALETTES = ${JSON.stringify(palettes, null, 2)} as const;

export const POSTER_LAYOUT = ${JSON.stringify(layout, null, 2)} as const;

export type PosterHabitat = keyof typeof POSTER_SCENES;
`,
);
console.log(`5 paisajes en ${OUT}`);
