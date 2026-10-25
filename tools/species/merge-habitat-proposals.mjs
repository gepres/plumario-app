// Junta dos propuestas independientes de hábitat (data/species/proposals/*.csv) en la tabla de
// revisión data/species/ica-habitats.xlsx, que se abre con Excel y lee tools/species/convert.mjs.
// Uso: node tools/species/merge-habitat-proposals.mjs
//
// - Si las dos propuestas coinciden, ese es el hábitat. Si no, queda la primera y la fila se marca
//   para revisar; también si alguna de las dos tiene confianza baja.
// - No pisa una tabla ya revisada: si existe y tiene filas con revisado = sí, se detiene.
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isYes, readHabitatTable, writeHabitatTable } from './habitat-table.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(ROOT, 'data', 'species');
const PRIMARY = join(DIR, 'proposals', 'habitats-claude.csv');
const SECONDARY = join(DIR, 'proposals', 'habitats-codex.csv');
const CLASS_LABELS = { bird: 'Ave', mammal: 'Mamífero', reptile: 'Reptil' };

// CSV de las propuestas: separado por comas, con comillas cuando el campo las necesita.
function parseProposals(content) {
  const [, ...lines] = content.replace(/^﻿/, '').trim().split(/\r?\n/);
  return new Map(lines.map((line) => {
    const cells = [...line.matchAll(/("(?:[^"]|"")*"|[^,]*)(?:,|$)/g)].map((m) => m[1].replace(/^"|"$/g, '').replace(/""/g, '"'));
    return [cells[0], { habitat: cells[1], confidence: cells[2], reason: cells[3] }];
  }));
}

const existing = await readHabitatTable();
if (existing?.some((row) => isYes(row.revisado))) {
  console.error('data/species/ica-habitats.xlsx ya tiene filas revisadas: no la piso. Bórrala a mano si de verdad quieres rehacerla.');
  process.exit(1);
}

const catalog = JSON.parse(await readFile(join(DIR, 'ica.json'), 'utf8'));
const primary = parseProposals(await readFile(PRIMARY, 'utf8'));
const secondary = parseProposals(await readFile(SECONDARY, 'utf8'));

const rows = [];
for (const s of catalog.species) {
  const a = primary.get(s.scientificName);
  const b = secondary.get(s.scientificName);
  if (!a || !b) throw new Error(`Falta la propuesta de ${s.scientificName}`);
  const review = a.habitat !== b.habitat || a.confidence === 'baja' || b.confidence === 'baja';
  rows.push({
    n_excel: s.sourceNumber,
    numero_album: s.albumNumber ?? null,
    clase: CLASS_LABELS[s.taxonClass],
    nombre_comun: s.commonName ?? '',
    nombre_cientifico: s.scientificName,
    habitat: a.habitat,
    revisar: review ? 'sí' : 'no',
    motivo: a.reason,
    propuesta_codex: b.habitat,
    motivo_codex: b.reason,
    revisado: 'no',
  });
}
await writeHabitatTable(rows);
console.log(`data/species/ica-habitats.xlsx: ${rows.length} filas, ${rows.filter((r) => r.revisar === 'sí').length} para revisar`);
