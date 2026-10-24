import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Ejecutar: node contraste.mjs
// No hay excepciones para A/B: cualquier incumplimiento produce código 1.
const directory = dirname(fileURLToPath(import.meta.url));
const baseKeys = [
  'opcion', 'nombre', 'modo', 'bg', 'sup', 'sup2', 'ink', 'txt2', 'linea',
  'borde', 'pri', 'priInk', 'acento', 'acentoInk', 'sol', 'solInk', 'hero',
  'heroInk', 'heroTxt2', 'heroPista', 'heroChip', 'exito', 'aviso', 'error',
  'revelar', 'revelarTxt2', 'campo', 'barra', 'navInactivo', 'navTrazo',
  'navRelleno', 'fab', 'fabTinta', 'oscuro', 'hab', 'pista', 'sombra', 'tablero',
];
const extraKeys = [
  'lema', 'descripcion', 'logoTarjeta', 'logoDoblez', 'logoTrazo',
  'logoSello', 'logoEstrella', 'logoIcono',
];
const expectedKeys = [...baseKeys, ...extraKeys];
const expectedThemes = ['a', 'b', 'c', 'd', 'e', 'f'].flatMap(
  letter => [`${letter}-claro`, `${letter}-oscuro`],
);

function color(value) {
  if (typeof value !== 'string') throw new Error(`Color inválido: ${value}`);
  const input = value.trim();
  const hex = /^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.exec(input);
  if (hex) {
    let digits = hex[1];
    if (digits.length <= 4) digits = [...digits].map(c => c + c).join('');
    const channels = digits.match(/../g).map(c => Number.parseInt(c, 16) / 255);
    return { rgb: channels.slice(0, 3), alpha: channels[3] ?? 1 };
  }
  const rgb = /^rgba?\(\s*([^()]+)\s*\)$/i.exec(input);
  if (rgb) {
    const values = rgb[1].split(',').map(c => c.trim());
    if (values.length !== 3 && values.length !== 4) {
      throw new Error(`Canales inválidos: ${input}`);
    }
    const channel = (c, scale) => {
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)%?$/.test(c)) {
        throw new Error(`Canal inválido: ${c}`);
      }
      const result = Number.parseFloat(c) / (c.endsWith('%') ? 100 : scale);
      if (!Number.isFinite(result) || result < 0 || result > 1) {
        throw new Error(`Canal fuera de rango: ${c}`);
      }
      return result;
    };
    return {
      rgb: values.slice(0, 3).map(c => channel(c, 255)),
      alpha: values.length === 4 ? channel(values[3], 1) : 1,
    };
  }
  throw new Error(`Formato de color no admitido: ${input}`);
}

// Composición alfa en sRGB; después se linealiza para obtener luminancia WCAG.
function over(foreground, background) {
  const alpha = foreground.alpha + background.alpha * (1 - foreground.alpha);
  const rgb = foreground.rgb.map((c, i) => alpha === 0 ? 0 : (
    c * foreground.alpha + background.rgb[i] * background.alpha * (1 - foreground.alpha)
  ) / alpha);
  return { rgb, alpha };
}

function luminance(opaqueColor) {
  if (opaqueColor.alpha !== 1) throw new Error('Falta un fondo opaco para componer rgba.');
  const linear = opaqueColor.rgb.map(c => c <= 0.04045
    ? c / 12.92
    : ((c + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(foreground, background) {
  const first = luminance(over(color(foreground), background));
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function stops(value) {
  if (!/^(?:linear|radial)-gradient\(/i.test(value)) {
    color(value);
    return [value, value]; // Un hero sólido tiene dos paradas idénticas.
  }
  const colors = value.match(/#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})\b|rgba?\([^)]*\)/gi);
  if (!colors || colors.length < 2) throw new Error(`Gradiente inválido: ${value}`);
  colors.forEach(color);
  return colors;
}

const failures = [];
const formatFailures = [];
let total = 0;
let passingThemes = 0;

function checkTheme(id, theme) {
  const keys = Object.keys(theme);
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    throw new Error('Se requieren las 38 claves originales en orden, lema, descripcion y las 6 del logo.');
  }
  if (theme.opcion !== id[0].toUpperCase()
    || theme.oscuro !== id.endsWith('-oscuro')
    || theme.modo !== (theme.oscuro ? 'Oscuro' : 'Claro')) {
    throw new Error('opcion, modo u oscuro no coinciden con el identificador.');
  }
  for (const key of ['nombre', 'lema', 'descripcion']) {
    if (typeof theme[key] !== 'string' || !theme[key].trim()) {
      throw new Error(`Falta el texto de ${key}.`);
    }
  }
  if (!Array.isArray(theme.hab) || theme.hab.length !== 5) {
    throw new Error('hab debe contener cinco colores: Litoral, Humedales, Desierto, Sierra, Mar abierto.');
  }
  theme.hab.forEach(color);
  for (const key of ['linea', 'heroPista', 'heroChip', 'navRelleno', 'pista', 'logoDoblez']) {
    color(theme[key]);
  }

  const canvas = color(theme.tablero);
  if (canvas.alpha !== 1) throw new Error('tablero debe ser opaco.');
  const bg = over(color(theme.bg), canvas);
  const sup = over(color(theme.sup), bg);
  // Las superficies secundarias, campos y rellenos se componen sobre sup.
  const surfaces = { bg, sup };
  for (const key of ['sup2', 'campo', 'pri', 'acento', 'sol']) {
    surfaces[key] = over(color(theme[key]), sup);
  }
  surfaces.barra = over(color(theme.barra), bg);
  surfaces.logoIcono = over(color(theme.logoIcono), bg);
  surfaces.logoTarjeta = over(color(theme.logoTarjeta), surfaces.logoIcono);
  surfaces.logoSello = over(color(theme.logoSello), surfaces.logoTarjeta);

  const results = [];
  const check = (foregroundKey, backgroundLabel, background, minimum) => {
    const value = contrast(theme[foregroundKey], background);
    const pass = value >= minimum; // Se compara sin redondear ni tolerancias.
    const result = { id, foregroundKey, backgroundLabel, value, minimum, pass };
    total++;
    results.push(result);
    if (!pass) failures.push(result);
  };
  const on = (foregroundKey, backgroundKeys, minimum = 4.5) => {
    for (const key of backgroundKeys) check(foregroundKey, key, surfaces[key], minimum);
  };
  const onStops = (foregroundKey, backgroundKey, minimum = 4.5) => {
    stops(theme[backgroundKey]).forEach((stop, index) => {
      check(foregroundKey, `${backgroundKey}[${index + 1}] ${stop}`, over(color(stop), bg), minimum);
    });
  };

  on('ink', ['bg', 'sup', 'sup2', 'campo']);
  on('txt2', ['bg', 'sup']);
  on('pri', ['bg', 'sup']);
  on('priInk', ['pri']);
  on('acentoInk', ['acento']);
  on('solInk', ['sol']);
  onStops('heroInk', 'hero');
  onStops('heroTxt2', 'hero');
  onStops('revelarTxt2', 'revelar');
  for (const key of ['exito', 'aviso', 'error']) on(key, ['bg', 'sup']);
  onStops('fabTinta', 'fab'); // Incluye también las paradas intermedias.
  on('navTrazo', ['barra'], 3);
  on('navInactivo', ['barra'], 3);
  on('borde', ['campo'], 3);
  on('logoTrazo', ['logoTarjeta']);
  on('logoEstrella', ['logoSello']);
  onStops('logoTarjeta', 'hero', 3);
  on('logoTarjeta', ['logoIcono'], 3);

  const failed = results.filter(result => !result.pass).length;
  if (failed === 0) passingThemes++;
  console.log(`\n${id} | ${theme.nombre} | ${theme.modo} | ${results.length - failed}/${results.length} cumplen`);
  for (const result of results) {
    const comparison = result.pass ? '>=' : '<';
    console.log(`  ${result.pass ? 'OK   ' : 'FALLO'} ${result.foregroundKey} sobre ${result.backgroundLabel}: ${result.value.toFixed(4)}:1 ${comparison} ${result.minimum.toFixed(1)}:1`);
  }
}

try {
  const palettes = JSON.parse(readFileSync(join(directory, 'paletas.json'), 'utf8'));
  if (JSON.stringify(Object.keys(palettes)) !== JSON.stringify(expectedThemes)) {
    formatFailures.push(`Se requieren, en este orden, ${expectedThemes.join(', ')}.`);
  }
  console.log('PLUMARIO | Verificación de contraste WCAG 2.x');
  console.log('Texto: mínimo 4.5:1. Navegación, borde y silueta del logo: mínimo 3:1.');
  console.log('rgba se compone sobre su fondo antes de calcular la luminancia relativa.');
  console.log('Se evalúan todas las paradas declaradas; los sólidos se repiten como dos paradas.');
  console.log('La decisión usa el valor completo; la salida muestra cuatro decimales.');
  console.log('A/B no tienen exenciones: sus fallos también producen código de salida 1.');

  for (const id of expectedThemes) {
    try {
      if (!palettes[id] || typeof palettes[id] !== 'object') throw new Error('Tema ausente o inválido.');
      checkTheme(id, palettes[id]);
    } catch (error) {
      formatFailures.push(`${id}: ${error.message}`);
    }
  }
  const existing = failures.filter(result => /^[ab]-/.test(result.id)
    && !result.foregroundKey.startsWith('logo'));
  const added = failures.filter(result => !existing.includes(result));

  console.log('\nRESULTADO');
  console.log(`${total - failures.length}/${total} comprobaciones de contraste cumplen; ${passingThemes}/${expectedThemes.length} temas completos cumplen.`);
  console.log(`Fallos en claves de A/B: ${existing.length}. Fallos en C–F o logos: ${added.length}.`);
  if (failures.length) {
    console.log('\nINCUMPLIMIENTOS');
    for (const result of failures) {
      console.log(`  ${result.id}: ${result.foregroundKey} sobre ${result.backgroundLabel} = ${result.value.toFixed(4)}:1; mínimo ${result.minimum.toFixed(1)}:1.`);
    }
  }
  if (formatFailures.length) {
    console.log('\nERRORES DE FORMATO');
    formatFailures.forEach(message => console.log(`  ${message}`));
  }
  process.exitCode = failures.length || formatFailures.length ? 1 : 0;
  console.log(`\nCódigo de salida: ${process.exitCode}`);
} catch (error) {
  console.log(`ERROR: ${error.message}`);
  console.log('Código de salida: 1');
  process.exitCode = 1;
}
