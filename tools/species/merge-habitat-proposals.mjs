// Junta dos propuestas independientes de hábitat (data/species/proposals/*.csv) en la tabla de
// revisión data/species/ica-habitats.csv, que se abre con Excel y lee tools/species/convert.mjs.
// Uso: node tools/species/merge-habitat-proposals.mjs
//
// - Si las dos propuestas coinciden, ese es el hábitat. Si no, queda la primera y la fila se marca
//   para revisar; también si alguna de las dos tiene confianza baja.
// - Separada por «;» y con BOM, para que Excel en español la abra en columnas y con tildes.
// - No pisa una tabla ya revisada: si existe y tiene filas con revisado = sí, se detiene.
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(ROOT, 'data', 'species');
const PRIMARY = join(DIR, 'proposals', 'habitats-claude.csv');
const SECONDARY = join(DIR, 'proposals', 'habitats-codex.csv');
const TARGET = join(DIR, 'ica-habitats.csv');
const CLASS_LABELS = { bird: 'Ave', mammal: 'Mamífero', reptile: 'Reptil' };

// CSV de las propuestas: separado por comas, con comillas cuando el campo las necesita.
function parseProposals(content) {
  const [, ...lines] = content.replace(/^﻿/, '').trim().split(/\r?\n/);
  return new Map(lines.map((line) => {
    const cells = [...line.matchAll(/("(?:[^"]|"")*"|[^,]*)(?:,|$)/g)].map((m) => m[1].replace(/^"|"$/g, '').replace(/""/g, '"'));
    return [cells[0], { habitat: cells[1], confidence: cells[2], reason: cells[3] }];
  }));
}

if (existsSync(TARGET) && /;s[ií]\s*$/im.test(await readFile(TARGET, 'utf8'))) {
  console.error('data/species/ica-habitats.csv ya tiene filas revisadas: no la piso. Bórrala a mano si de verdad quieres rehacerla.');
  process.exit(1);
}

const catalog = JSON.parse(await readFile(join(DIR, 'ica.json'), 'utf8'));
const primary = parseProposals(await readFile(PRIMARY, 'utf8'));
const secondary = parseProposals(await readFile(SECONDARY, 'utf8'));

const cell = (value) => (/[;"\n]/.test(String(value)) ? `"${String(value).replace(/"/g, '""')}"` : String(value ?? ''));
const header = ['n_excel', 'numero_album', 'clase', 'nombre_comun', 'nombre_cientifico', 'habitat', 'revisar', 'motivo', 'propuesta_codex', 'motivo_codex', 'revisado'];
const rows = [header.join(';')];
let toReview = 0;
for (const s of catalog.species) {
  const a = primary.get(s.scientificName);
  const b = secondary.get(s.scientificName);
  if (!a || !b) throw new Error(`Falta la propuesta de ${s.scientificName}`);
  const review = a.habitat !== b.habitat || a.confidence === 'baja' || b.confidence === 'baja';
  if (review) toReview++;
  rows.push([s.sourceNumber, s.albumNumber ?? '', CLASS_LABELS[s.taxonClass], s.commonName ?? '', s.scientificName, a.habitat, review ? 'sí' : 'no', a.reason, b.habitat, b.reason, 'no'].map(cell).join(';'));
}
await writeFile(TARGET, '﻿' + rows.join('\r\n') + '\r\n');
console.log(`data/species/ica-habitats.csv: ${catalog.species.length} filas, ${toReview} para revisar`);
