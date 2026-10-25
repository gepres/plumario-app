// La tabla de revisión de hábitats, data/species/ica-habitats.xlsx: la arma
// merge-habitat-proposals.mjs, la revisa una persona en Excel y la lee convert.mjs.
//
// Es un .xlsx y no un CSV para que conserve lo que ayuda a revisar: filtros en el encabezado,
// listas desplegables en las columnas que se editan (habitat y revisado) y la primera fila fija.
// El cambio de cada revisión se ve igual en git, en data/species/ica.json.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import ExcelJS from 'exceljs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const HABITAT_TABLE = join(ROOT, 'data', 'species', 'ica-habitats.xlsx');

// Etiquetas de la tabla (en español, para quien la edita) → claves del dominio.
export const HABITAT_KEYS = { Litoral: 'coast', Humedales: 'wetlands', Desierto: 'desert', Sierra: 'highlands', 'Mar abierto': 'openSea' };

// Columnas en orden, con su ancho en Excel. Las editables llevan lista desplegable.
const COLUMNS = [
  { key: 'n_excel', width: 8 },
  { key: 'numero_album', width: 9 },
  { key: 'clase', width: 10 },
  { key: 'nombre_comun', width: 30 },
  { key: 'nombre_cientifico', width: 30 },
  { key: 'habitat', width: 14, options: Object.keys(HABITAT_KEYS) },
  { key: 'revisar', width: 9 },
  { key: 'motivo', width: 38, wrap: true },
  { key: 'propuesta_codex', width: 14 },
  { key: 'motivo_codex', width: 48, wrap: true },
  { key: 'revisado', width: 10, options: ['sí', 'no'] },
];

/** «sí», «si» o «Sí» (Excel o quien escribe pueden quitar la tilde o poner mayúscula). */
export const isYes = (value) => /^s[ií]$/i.test(String(value ?? '').trim());

const cellText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && 'richText' in value) return value.richText.map((r) => r.text).join('').trim();
  return String(value).trim();
};

/** Las filas de la tabla como objetos con las claves del encabezado, o null si la tabla no existe. */
export async function readHabitatTable() {
  if (!existsSync(HABITAT_TABLE)) return null;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(HABITAT_TABLE);
  const sheet = workbook.worksheets[0];
  const header = new Map();
  sheet.getRow(1).eachCell((cell, column) => header.set(cellText(cell.value), column));
  for (const { key } of COLUMNS) if (!header.has(key)) throw new Error(`ica-habitats.xlsx: falta la columna «${key}»`);

  const rows = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const values = Object.fromEntries(COLUMNS.map(({ key }) => [key, cellText(row.getCell(header.get(key)).value)]));
    if (values.nombre_cientifico) rows.push(values);
  }
  return rows;
}

/** Escribe la tabla con filtros, la primera fila fija y listas desplegables en las columnas editables. */
export async function writeHabitatTable(rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Hábitats', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = COLUMNS.map(({ key, width }) => ({ header: key, key, width }));
  for (const row of rows) sheet.addRow(row);

  const header = sheet.getRow(1);
  header.font = { bold: true };
  const lastRow = rows.length + 1;
  COLUMNS.forEach(({ options, wrap }, i) => {
    const column = sheet.getColumn(i + 1);
    column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber > 1) cell.alignment = { vertical: 'top', wrapText: Boolean(wrap) };
    });
    if (!options) return;
    // Las columnas que se editan, en verde, para encontrarlas de un vistazo.
    header.getCell(i + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
    // Un solo rango por columna: validación por celda hace que ExcelJS escriba rangos que se
    // solapan, y Excel puede tomar el archivo por dañado.
    sheet.dataValidations.add(`${column.letter}2:${column.letter}${lastRow}`, {
      type: 'list',
      allowBlank: false,
      formulae: [`"${options.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Valor no válido',
      error: `Elige uno de la lista: ${options.join(', ')}.`,
    });
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: lastRow, column: COLUMNS.length } };
  await workbook.xlsx.writeFile(HABITAT_TABLE);
}
