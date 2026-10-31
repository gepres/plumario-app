// Saca de AVONET el peso y las medidas de las aves del álbum y los deja en data/species/ica-measures.json.
// Uso: pnpm species:measures (desde la raíz). Necesita data/sources/avonet-dataset-1.xlsx, que no se
// versiona: https://doi.org/10.6084/m9.figshare.16586228.v7 («AVONET Supplementary dataset 1.xlsx»).
//
// Las especies se buscan por nombre científico en las tres taxonomías de AVONET. Cuando el nombre
// cambió de género, RENAMED dice cómo se llama allí; esos cruces esperan la revisión de un biólogo.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import ExcelJS from 'exceljs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE = join(ROOT, 'data', 'sources', 'avonet-dataset-1.xlsx');
const CATALOG = join(ROOT, 'data', 'species', 'ica.json');
const TARGET = join(ROOT, 'data', 'species', 'ica-measures.json');

const SHEETS = { AVONET2_eBird: 'Species2', AVONET1_BirdLife: 'Species1', AVONET3_BirdTree: 'Species3' };

const RENAMED = {
  'Quechuavis decussata': 'Systellura decussata',
  'Hesperoburhinus superciliaris': 'Burhinus superciliaris',
  'Anarhynchus alticola': 'Charadrius alticola',
  'Anarhynchus collaris': 'Charadrius collaris',
  'Anarhynchus falklandicus': 'Charadrius falklandicus',
  'Anarhynchus mongolus': 'Charadrius mongolus',
  'Anarhynchus nivosus': 'Charadrius nivosus',
  'Anarhynchus wilsonia': 'Charadrius wilsonia',
  'Zonibyx modestus': 'Charadrius modestus',
  'Ardea ibis': 'Bubulcus ibis',
};

const number = (value) => {
  const parsed = Number(value);
  return value === 'NA' || value === null || value === undefined || Number.isNaN(parsed) ? null : parsed;
};

/** Primera aparición de cada nombre, en el orden de SHEETS: eBird tiene la taxonomía más reciente. */
async function readAvonet() {
  const found = new Map();
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(SOURCE, { sharedStrings: 'cache', styles: 'ignore', hyperlinks: 'ignore', worksheets: 'emit' });
  const bySheet = {};
  for await (const sheet of reader) {
    const column = SHEETS[sheet.name];
    if (!column) continue;
    const rows = new Map();
    let header = null;
    for await (const row of sheet) {
      const values = row.values;
      if (!header) {
        header = values;
        continue;
      }
      const field = (name) => values[header.indexOf(name)];
      rows.set(field(column), { massG: number(field('Mass')), wingMm: number(field('Wing.Length')), beakMm: number(field('Beak.Length_Culmen')) });
    }
    bySheet[sheet.name] = rows;
  }
  for (const name of Object.keys(SHEETS)) for (const [species, row] of bySheet[name]) if (!found.has(species)) found.set(species, row);
  return found;
}

const catalog = JSON.parse(await readFile(CATALOG, 'utf8'));
const album = catalog.species.filter((s) => s.albumNumber !== null);
const avonet = await readAvonet();

const species = {};
const missing = [];
for (const { id, scientificName } of album) {
  const avonetName = RENAMED[scientificName] ?? scientificName;
  const row = avonet.get(avonetName);
  if (!row) {
    missing.push(scientificName);
    continue;
  }
  species[id] = { ...row, ...(avonetName === scientificName ? {} : { avonetName }) };
}

await writeFile(
  TARGET,
  JSON.stringify(
    {
      source: {
        citation: 'Tobias et al. (2022). AVONET: morphological, ecological and geographical data for all birds. Ecology Letters 25(3): 581-597.',
        doi: 'https://doi.org/10.6084/m9.figshare.16586228.v7',
        license: 'CC BY 4.0',
        units: { massG: 'gramos', wingMm: 'milímetros, del doblez a la punta', beakMm: 'milímetros, culmen' },
      },
      reviewed: false,
      missing,
      species,
    },
    null,
    2,
  ) + '\n',
);
console.log(`${Object.keys(species).length} de ${album.length} aves con medidas. Sin datos: ${missing.join(', ') || 'ninguna'}.`);
