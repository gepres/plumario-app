// Genera src/colors.ts desde la paleta elegida en design/palettes/palettes.json.
// Uso: pnpm tokens (desde la raíz) o pnpm generate (desde este paquete).
//
// El diseño nombra los colores en español abreviado (sup, pri, txt2…); el código los usa en inglés.
// La traducción es esta tabla: si el diseño agrega una clave que no está aquí, el generador falla
// en vez de perderla en silencio. La tabla también sale exportada (designKeyMap) para portar
// pantallas del canvas: un {{t.sup}} del artboard es t.surface en la app.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PALETTE = 'f'; // F · Ribera, elegida el 24 oct 2026.
const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, '..', '..', '..', 'design', 'palettes', 'palettes.json');
const TARGET = join(HERE, '..', 'src', 'colors.ts');

// Solo sirven para presentar la paleta en el canvas, no a la app.
const PRESENTATION_ONLY = ['opcion', 'nombre', 'modo', 'lema', 'descripcion', 'tablero'];

const KEY_MAP = {
  bg: 'background',
  sup: 'surface',
  sup2: 'surfaceAlt',
  ink: 'text',
  txt2: 'textSecondary',
  linea: 'line',
  borde: 'border',
  pri: 'primary',
  priInk: 'onPrimary',
  acento: 'accent',
  acentoInk: 'onAccent',
  sol: 'sun',
  solInk: 'onSun',
  hero: 'hero',
  heroInk: 'onHero',
  heroTxt2: 'onHeroSecondary',
  heroPista: 'heroTrack',
  heroChip: 'heroChip',
  exito: 'success',
  aviso: 'warning',
  error: 'error',
  revelar: 'reveal',
  revelarTxt2: 'onRevealSecondary',
  campo: 'field',
  barra: 'tabBar',
  navInactivo: 'tabInactive',
  navTrazo: 'tabActiveStroke',
  navRelleno: 'tabActiveFill',
  fab: 'fab',
  fabTinta: 'onFab',
  oscuro: 'isDark',
  hab: 'habitats',
  pista: 'track',
  sombra: 'cardShadow',
  logoTarjeta: 'logoCard',
  logoDoblez: 'logoFold',
  logoTrazo: 'logoStroke',
  logoSello: 'logoSeal',
  logoEstrella: 'logoStar',
  logoIcono: 'logoTile',
};
const GRADIENTS = ['hero', 'revelar', 'fab'];
// En el diseño, hab es una lista en este orden: Litoral, Humedales, Desierto, Sierra, Mar abierto.
const HABITATS = ['coast', 'wetlands', 'desert', 'highlands', 'openSea'];

// «linear-gradient(135deg, #44682E 0%, #2B5A4B 100%)» o «radial-gradient(circle at 50% 34%, …)»
// pasan a datos que entienden SVG, Skia o expo-linear-gradient. Un color sólido es un lineal de
// dos paradas iguales. Se conserva el CSS original para la web.
function gradient(css) {
  const stops = (text) => [...text.matchAll(/(#[\da-f]{3,8}|rgba?\([^)]*\))\s+([\d.]+)%/gi)]
    .map(([, color, pos]) => ({ color, position: Number(pos) / 100 }));
  const linear = /^linear-gradient\(\s*([\d.]+)deg\s*,(.*)\)$/i.exec(css);
  if (linear) return { type: 'linear', angle: Number(linear[1]), stops: stops(linear[2]), css };
  const radial = /^radial-gradient\(\s*circle at ([\d.]+)% ([\d.]+)%\s*,(.*)\)$/i.exec(css);
  if (radial) return { type: 'radial', center: { x: Number(radial[1]) / 100, y: Number(radial[2]) / 100 }, stops: stops(radial[3]), css };
  if (/^#[\da-f]{3,8}$/i.test(css)) return { type: 'linear', angle: 180, stops: [{ color: css, position: 0 }, { color: css, position: 1 }], css };
  throw new Error(`Degradado que el generador no sabe leer: ${css}`);
}

function mode(theme, name) {
  const out = {};
  for (const [key, value] of Object.entries(theme)) {
    if (PRESENTATION_ONLY.includes(key)) continue;
    const codeKey = KEY_MAP[key];
    if (!codeKey) throw new Error(`La clave «${key}» del diseño no tiene traducción en KEY_MAP (${name})`);
    if (GRADIENTS.includes(key)) out[codeKey] = gradient(value);
    else if (key === 'hab') out[codeKey] = Object.fromEntries(HABITATS.map((h, i) => [h, value[i]]));
    else out[codeKey] = value;
  }
  for (const key of GRADIENTS) {
    if (out[KEY_MAP[key]].stops.length < 2) throw new Error(`${key} quedó con menos de dos paradas (${name})`);
  }
  return out;
}

const themes = JSON.parse(await readFile(SOURCE, 'utf8'));
const light = themes[`${PALETTE}-claro`];
const dark = themes[`${PALETTE}-oscuro`];
if (!light || !dark) throw new Error(`palettes.json no tiene ${PALETTE}-claro y ${PALETTE}-oscuro`);

const colors = { light: mode(light, 'claro'), dark: mode(dark, 'oscuro') };
const text = `// GENERADO por scripts/generate.mjs desde design/palettes/palettes.json — no editar a mano.
// Paleta ${light.opcion} · ${light.nombre}: ${light.lema}.
// Para cambiar un color, cámbialo en el diseño y corre \`pnpm tokens\` desde la raíz.

export const palette = ${JSON.stringify({ option: light.opcion, name: light.nombre, motto: light.lema })} as const;

/** Clave del diseño (palettes.json, artboards) → clave en el código. */
export const designKeyMap = ${JSON.stringify(KEY_MAP, null, 2)} as const;

export const colors = ${JSON.stringify(colors, null, 2)} as const;
`;
await writeFile(TARGET, text);
console.log(`src/colors.ts: paleta ${light.opcion} · ${light.nombre}, ${Object.keys(colors.light).length} claves por modo`);
