// Genera los íconos de la app desde el logo del diseño (diseno/project/TemaLogo.dc.html) con los
// colores del logo de la paleta elegida (f-claro en diseno/paletas/paletas.json).
// Uso: pnpm icons (desde la raíz). Escribe en apps/mobile/assets/images/.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(APP, '..', '..');
const TARGET = join(APP, 'assets', 'images');
const themes = JSON.parse(await readFile(join(ROOT, 'diseno', 'paletas', 'paletas.json'), 'utf8'));
const t = themes['f-claro'];

// El dibujo de TemaLogo: tarjeta-cromo girada, ave a trazo y sello con estrella.
const VIEW = { x: 78, y: 58, width: 360, height: 412 };
const CARD = 'M140 86 H372 A40 40 0 0 1 412 126 V370 L338 444 H140 A40 40 0 0 1 100 404 V126 A40 40 0 0 1 140 86 Z';
const FOLD = 'M412 370 L338 444 C 346 408 368 380 412 370 Z';
const BIRD = `<g fill="none" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" transform="translate(91 86) scale(1.06)">
<path d="M156 28 L156 98"/><circle cx="156" cy="117" r="18"/>
<path d="M156 136 C 136 146 132 186 140 216 C 146 236 166 236 172 216 C 180 186 176 146 156 136 Z"/>
<path d="M140 160 L 30 146 L 37 172 L 60 167 L 63 188 L 88 181 L 92 200 L 140 192"/>
<path d="M172 160 L 282 146 L 275 172 L 252 167 L 249 188 L 224 181 L 220 200 L 172 192"/>
<path d="M144 230 L 128 290 L 146 283 L 156 302 L 166 283 L 184 290 L 168 230"/></g>`;
const STAR = 'M362 114l5.9 13.2 14.4 1.3-10.9 9.6 3.2 14.1-12.6-7.4-12.6 7.4 3.2-14.1-10.9-9.6 14.4-1.3z';

const mark = () => `<g transform="rotate(-6 256 262)">
<path d="${CARD}" fill="${t.logoTarjeta}"/><path d="${FOLD}" fill="${t.logoDoblez}"/>
${BIRD.replace('fill="none"', `fill="none" stroke="${t.logoTrazo}"`)}
<circle cx="362" cy="134" r="30" fill="${t.logoSello}" stroke="${t.logoTarjeta}" stroke-width="7"/>
<path d="${STAR}" fill="${t.logoEstrella}"/></g>`;

// Monocromo (Android 13+ lo tiñe): solo cuenta el alfa, así que el ave y la estrella se recortan.
const monochrome = () => `<defs><mask id="cutout" maskUnits="userSpaceOnUse" x="0" y="0" width="520" height="520">
<rect x="0" y="0" width="520" height="520" fill="#fff"/>
<g transform="rotate(-6 256 262)">${BIRD.replace('fill="none"', 'fill="none" stroke="#000"')}<path d="${STAR}" fill="#000"/></g></mask></defs>
<g mask="url(#cutout)"><g transform="rotate(-6 256 262)"><path d="${CARD}" fill="#fff"/><circle cx="362" cy="134" r="30" fill="#fff"/></g></g>`;

/** El logo centrado en un lienzo cuadrado, ocupando `scale` del alto. */
function canvas(side, scale, drawing, { background, cornerRadius = 0 } = {}) {
  const height = side * scale;
  const width = (height * VIEW.width) / VIEW.height;
  const backgroundSvg = background ? `<rect width="${side}" height="${side}" rx="${cornerRadius}" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="0 0 ${side} ${side}">${backgroundSvg}
<svg x="${(side - width) / 2}" y="${(side - height) / 2}" width="${width}" height="${height}" viewBox="${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}">${drawing}</svg></svg>`;
}

const OUTPUTS = {
  // iOS y el ícono general: cuadrado lleno, sin esquinas (las pone el sistema).
  'icon.png': canvas(1024, 0.8, mark(), { background: t.logoIcono }),
  // Android adaptativo: primer plano transparente dentro de la zona segura (66 de 108 dp); el
  // fondo verde lo pone app.config.ts.
  'android-icon-foreground.png': canvas(1024, 0.56, mark()),
  'android-icon-monochrome.png': canvas(1024, 0.56, monochrome()),
  // Arranque: el ícono con esquinas, porque la tarjeta casi blanca se perdería sobre el fondo blanco.
  'splash-icon.png': canvas(512, 0.8, mark(), { background: t.logoIcono, cornerRadius: 512 * 0.225 }),
  'favicon.png': canvas(48, 0.8, mark(), { background: t.logoIcono, cornerRadius: 48 * 0.225 }),
};

for (const [name, svg] of Object.entries(OUTPUTS)) {
  const png = new Resvg(svg, { background: 'rgba(0,0,0,0)' }).render().asPng();
  await writeFile(join(TARGET, name), png);
  console.log(`${name}: ${Math.round(png.length / 1024)} KB`);
}
