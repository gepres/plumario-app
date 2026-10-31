// Convierte data/sources/species-ica.xlsx en data/species/ica.json, el catálogo versionado que se
// carga a Firestore. Uso: pnpm species:convert (desde la raíz).
//
// - Las columnas del Excel (en español) pasan a claves en inglés; «—» pasa a null.
// - El hábitat del álbum no viene en el Excel: sale de data/species/ica-habitats.xlsx, que propone
//   la IA y revisa una persona. Sin esa tabla, el hábitat queda en null.
// - El álbum es de aves: solo ellas llevan número de álbum, correlativo en el orden del Excel.
// - Las fotos del Excel (de terceros) no se exportan.
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import ExcelJS from 'exceljs';

import { HABITAT_KEYS, isYes, readHabitatTable } from './habitat-table.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE = join(ROOT, 'data', 'sources', 'species-ica.xlsx');
const TARGET = join(ROOT, 'data', 'species', 'ica.json');

const COLUMNS = {
  'N.º': 'sourceNumber',
  Clase: 'className',
  Orden: 'order',
  Familia: 'family',
  Género: 'genus',
  'Epíteto específico': 'epithet',
  'Nombre científico': 'scientificName',
  'Nombre común': 'commonName',
  'Nombre en inglés': 'englishName',
  'Descripción breve': 'description',
  'Categoría nacional': 'nationalCategory',
  IUCN: 'iucn',
  CITES: 'cites',
  CMS: 'cms',
  Bioma: 'biome',
  Endémica: 'endemic',
};
const CLASSES = { Aves: 'bird', Mammalia: 'mammal', Reptilia: 'reptile' };
const ALBUM_CLASS = 'bird';
// Categorías de amenaza de la IUCN (también las usa la categorización nacional del Perú).
const THREATENED = new Set(['CR', 'EN', 'VU']);
// Emblemáticas de Ica o del Perú (cromo Rubí): la parihuana de Paracas y las aves guaneras. Es la lista
// editorial de design/project/CategoriasCromos.dc.html, «a validar con el cliente».
const EMBLEMATIC = new Set(['Phoenicopterus chilensis', 'Pelecanus thagus', 'Sula variegata', 'Phalacrocorax bougainvillii', 'Vultur gryphus', 'Spheniscus humboldti']);
// El Excel la marca como endémica; el biólogo la corrigió con la lista de Plenge de marzo de 2026.
const NOT_ENDEMIC = new Set(['Cinclodes taczanowskii']);

const text = (value) => {
  if (value === null || value === undefined) return null;
  const raw = typeof value === 'object' && 'richText' in value ? value.richText.map((r) => r.text).join('') : String(value);
  const trimmed = raw.trim();
  return trimmed === '' || trimmed === '—' ? null : trimmed;
};

async function readHabitats() {
  const rows = (await readHabitatTable()) ?? [];
  const map = new Map();
  for (const row of rows) {
    const key = HABITAT_KEYS[row.habitat];
    if (!key) throw new Error(`ica-habitats.xlsx: hábitat desconocido «${row.habitat}» en ${row.nombre_cientifico}`);
    map.set(row.nombre_cientifico, { habitat: key, reviewed: isYes(row.revisado) });
  }
  return map;
}

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(SOURCE);
const sheet = workbook.worksheets[0];

// La tabla empieza en la fila cuyo primer valor es «N.º»; arriba hay título, fecha y notas.
let headerRow = null;
sheet.eachRow((row, number) => {
  if (headerRow === null && text(row.getCell(1).value) === 'N.º') headerRow = number;
});
if (headerRow === null) throw new Error('No encontré la fila de encabezados (N.º) en el Excel');
const headers = sheet.getRow(headerRow).values.slice(1).map(text);
for (const h of headers) if (h && !COLUMNS[h]) throw new Error(`Columna nueva en el Excel sin traducción: «${h}»`);

const generatedNote = text(sheet.getRow(3).getCell(1).value);
const habitats = await readHabitats();

const species = [];
for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
  const values = sheet.getRow(r).values.slice(1);
  if (!values.length || text(values[0]) === null) continue;
  const raw = Object.fromEntries(headers.map((h, i) => [COLUMNS[h], text(values[i])]));
  const taxonClass = CLASSES[raw.className];
  if (!taxonClass) throw new Error(`Clase desconocida «${raw.className}» en ${raw.scientificName}`);
  // «LC (as Lycalopex griseus)»: la categoría y la nota del sinónimo con que la evaluó la IUCN.
  const iucnMatch = raw.iucn ? /^([A-Z]{2})(?:\s*\((.+)\))?$/.exec(raw.iucn) : null;
  const iucn = iucnMatch ? iucnMatch[1] : raw.iucn;
  const habitat = habitats.get(raw.scientificName);
  species.push({
    id: raw.scientificName.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''),
    regionId: 'ica',
    sourceNumber: Number(raw.sourceNumber),
    taxonClass,
    order: raw.order,
    family: raw.family,
    genus: raw.genus,
    epithet: raw.epithet,
    scientificName: raw.scientificName,
    commonName: raw.commonName,
    englishName: raw.englishName,
    description: raw.description,
    nationalCategory: raw.nationalCategory,
    iucn,
    iucnNote: iucnMatch?.[2] ?? null,
    cites: raw.cites,
    cms: raw.cms,
    biome: raw.biome,
    endemic: raw.endemic === 'Sí' && !NOT_ENDEMIC.has(raw.scientificName),
    emblematic: EMBLEMATIC.has(raw.scientificName),
    threatened: THREATENED.has(raw.nationalCategory ?? '') || THREATENED.has(iucn ?? ''),
    habitat: habitat?.habitat ?? null,
    habitatReviewed: habitat?.reviewed ?? false,
  });
}

let albumNumber = 0;
for (const s of species) s.albumNumber = s.taxonClass === ALBUM_CLASS ? ++albumNumber : null;

for (const name of EMBLEMATIC) if (!species.some((s) => s.scientificName === name)) throw new Error(`Emblemática que no está en el Excel: ${name}`);

const ids = new Set(species.map((s) => s.id));
if (ids.size !== species.length) throw new Error('Hay dos especies con el mismo id (nombre científico repetido)');

const catalog = {
  region: { id: 'ica', name: 'Ica', albumClass: ALBUM_CLASS },
  source: { file: 'data/sources/species-ica.xlsx', note: generatedNote },
  species,
};
await writeFile(TARGET, JSON.stringify(catalog, null, 2) + '\n');

const byClass = species.reduce((m, s) => ((m[s.taxonClass] = (m[s.taxonClass] ?? 0) + 1), m), {});
const withHabitat = species.filter((s) => s.habitat).length;
console.log(`data/species/ica.json: ${species.length} especies (${Object.entries(byClass).map(([k, v]) => `${v} ${k}`).join(', ')}), ${albumNumber} en el álbum, ${species.filter((s) => s.threatened).length} amenazadas, ${withHabitat} con hábitat (${species.filter((s) => s.habitatReviewed).length} revisados)`);
