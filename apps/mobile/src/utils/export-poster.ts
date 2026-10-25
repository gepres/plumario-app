import { File, Paths } from 'expo-file-system';
import { printToFileAsync } from 'expo-print';
import { captureRef } from 'react-native-view-shot';

import { captureImage, exportFileName, type CaptureTarget } from './export-image';

// Exportar un póster (PosterListo): imagen PNG en alta para guardar o compartir, y PDF A3 para
// imprenta con 3 mm de sangrado y marcas de corte (PosterImpresion).

/** «Imagen PNG · Alta resolución, 3508 × 4961 px»: A3 a 300 ppp. */
export const POSTER_EXPORT_WIDTH = 3508;
export const POSTER_EXPORT_HEIGHT = 4961;

/** La imagen del póster como archivo PNG temporal, justo del tamaño A3 a 300 ppp. */
export function capturePosterPng(view: CaptureTarget, caption: string): Promise<string> {
  return captureImage(view, { width: POSTER_EXPORT_WIDTH, height: POSTER_EXPORT_HEIGHT, caption });
}

// Página del PDF: A3 (297 × 420 mm) más 13 mm por lado para las marcas de corte, en puntos.
const MM = 72 / 25.4;
const MARGIN = 13;
const BLEED = 3;
const PAGE = { width: (297 + MARGIN * 2) * MM, height: (420 + MARGIN * 2) * MM };

/**
 * El PDF para imprenta: la imagen se agranda 3 mm por lado (el sangrado, como en PosterImpresion)
 * y las marcas de corte quedan en el borde del A3.
 */
export async function createPosterPdf(view: CaptureTarget, caption: string): Promise<string> {
  // En JPEG de buena calidad: el PDF pesa mucho menos que con PNG y se ve igual impreso.
  const jpeg = await captureRef(view, { format: 'jpg', quality: 0.92, result: 'base64', width: POSTER_EXPORT_WIDTH, height: POSTER_EXPORT_HEIGHT });
  const mark = (x: number, y: number, w: number, h: number) => `<div style="position:absolute;left:${x}mm;top:${y}mm;width:${w}mm;height:${h}mm;background:#000"></div>`;
  const left = MARGIN;
  const top = MARGIN;
  const right = MARGIN + 297;
  const bottom = MARGIN + 420;
  const marks = [
    mark(1, top, 8, 0.2), mark(left, 1, 0.2, 8),
    mark(right + 4, top, 8, 0.2), mark(right, 1, 0.2, 8),
    mark(1, bottom, 8, 0.2), mark(left, bottom + 4, 0.2, 8),
    mark(right + 4, bottom, 8, 0.2), mark(right, bottom + 4, 0.2, 8),
  ].join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: ${297 + MARGIN * 2}mm ${420 + MARGIN * 2}mm; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body { position: relative; width: ${297 + MARGIN * 2}mm; height: ${420 + MARGIN * 2}mm; overflow: hidden; font-family: sans-serif; }
  </style></head><body>
    <img src="data:image/jpeg;base64,${jpeg}" style="position:absolute;left:${MARGIN - BLEED}mm;top:${MARGIN - BLEED}mm;width:${297 + BLEED * 2}mm;height:${420 + BLEED * 2}mm" />
    ${marks}
    <div style="position:absolute;left:0;right:0;top:${bottom + 5}mm;text-align:center;font-size:7pt;color:#333">${escapeHtml(caption)} · A3 297 × 420 mm · sangrado 3 mm · versión para imprenta</div>
  </body></html>`;
  const { uri } = await printToFileAsync({ html, width: PAGE.width, height: PAGE.height });
  // printToFileAsync le pone un nombre al azar; al compartirlo se ve mejor el del póster.
  const target = new File(Paths.cache, `${exportFileName(caption)}.pdf`);
  if (target.exists) target.delete();
  new File(uri).move(target);
  return target.uri;
}

// El título lo escribe la persona: se escapa antes de ponerlo en el HTML del PDF.
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
