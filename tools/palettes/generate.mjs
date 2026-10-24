// Genera los artboards de la página «Paletas» del canvas desde design/palettes/palettes.json.
// Uso: node tools/palettes/generate.mjs <carpeta> [--no-logo]
//   <carpeta>/project/ tiene la copia recién leída del canvas (canvas.json y Tema*.dc.html).
//   Escribe ahí Paleta<X><Modo>.dc.html por cada tema, pone todos los temas en las pantallas
//   Tema*, cambia el logo fijo de TemaLogin por TemaLogo y añade lo nuevo a canvas.json.
//   --no-logo genera las paletas sin el bloque del logo (para comparar con las originales).
//
// Las claves de cada tema (opcion, nombre, pri, logoTarjeta…), los nombres de los artboards y las
// props de TemaLogo vienen del canvas: son datos del diseño y quedan como están.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const folder = process.argv[2];
const withLogo = !process.argv.includes('--no-logo');
if (!folder) {
  console.error('Uso: node tools/palettes/generate.mjs <carpeta> [--no-logo]');
  process.exit(1);
}
const PROJECT = join(folder, 'project');
const themes = JSON.parse(await readFile(join(ROOT, 'design', 'palettes', 'palettes.json'), 'utf8'));

const SCREENS = [
  ['TemaLogin', 'Iniciar sesión'],
  ['TemaInicio', 'Inicio'],
  ['TemaAlbum', 'Álbum'],
  ['TemaRevelar', 'Cromo revelado'],
  ['TemaRecompensas', 'Recompensas'],
  ['TemaPerfil', 'Perfil']
];
const SWATCHES = [
  ['Fondo', 'bg'], ['Superficie', 'sup'], ['Superficie 2', 'sup2'], ['Texto', 'ink'], ['Texto 2', 'txt2'], ['Línea', 'linea'],
  ['Primario', 'pri'], ['Acento', 'acento'], ['Sol', 'sol'], ['Éxito', 'exito'], ['Aviso', 'aviso'], ['Error', 'error']
];
// Colores del lienzo de presentación, no de la paleta.
const PRESENTATION = {
  claro: { text: '#14181C', text2: '#4E5660', frame: '0 0 0 8px #FFFFFF, 0 24px 50px rgba(0,0,0,0.16)' },
  oscuro: { text: '#F1F3F6', text2: '#A7B0BA', frame: '0 0 0 8px #1B2026, 0 24px 50px rgba(0,0,0,0.5)' }
};
const DISPLAY = "'Bricolage Grotesque', 'Avenir Next', system-ui, sans-serif";

const fileFor = (t) => `Paleta${t.opcion}${t.modo}.dc.html`;
const logoColors = (t) => `tarjeta="${t.logoTarjeta}" doblez="${t.logoDoblez}" trazo="${t.logoTrazo}" sello="${t.logoSello}" estrella="${t.logoEstrella}"`;

function logoBlock(t) {
  return `<div style="flex: none; display: flex; gap: 16px">
<figure style="margin: 0; display: flex; flex-direction: column; align-items: center; gap: 8px"><dc-import name="TemaLogo" variante="icono" size="112" fondo="${t.logoIcono}" ${logoColors(t)} hint-size="112px,112px"></dc-import><figcaption style="font-size: 13px; font-weight: 700">Ícono de la app</figcaption></figure>
<figure style="margin: 0; display: flex; flex-direction: column; align-items: center; gap: 8px"><div style="width: 112px; height: 112px; border-radius: 24px; background: ${t.hero}; display: flex; align-items: center; justify-content: center"><dc-import name="TemaLogo" variante="marca" size="80" ${logoColors(t)} hint-size="70px,80px"></dc-import></div><figcaption style="font-size: 13px; font-weight: 700">En la portada</figcaption></figure>
</div>
`;
}

function paletteArtboard(themeId, t) {
  const mode = t.oscuro ? 'oscuro' : 'claro';
  const p = PRESENTATION[mode];
  const swatch = ([name, key]) => `<div style="display: flex; flex-direction: column; gap: 6px"><span aria-hidden="true" style="height: 56px; border-radius: 12px; background: ${t[key]}; box-shadow: inset 0 0 0 1px rgba(127,127,127,0.25)"></span><span style="font-size: 13px; font-weight: 700">${name}</span><span style="font-size: 12px; color: ${p.text2}">${t[key]}</span></div>`;
  const habitat = (c) => `<span aria-hidden="true" style="flex: 1; height: 14px; border-radius: 4px; background: ${c}"></span>`;
  const phone = ([screen, caption]) => `<figure style="margin: 0; display: flex; flex-direction: column; gap: 12px"><div style="width: 390px; height: 844px; border-radius: 32px; overflow: hidden; box-shadow: ${p.frame}"><dc-import name="${screen}" tema="${themeId}" hint-size="390px,844px"></dc-import></div><figcaption style="padding-top: 8px; font-size: 15px; font-weight: 700; text-align: center">${caption}</figcaption></figure>`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Opción ${t.opcion} · ${t.nombre} · modo ${mode}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Instrument+Sans:wght@400..700&family=Instrument+Serif:ital@0;1&display=swap">
<style>
body{margin:0}
</style>
</helmet>
<div style="width: 2668px; height: 1240px; box-sizing: border-box; overflow: hidden; padding: 52px 64px; background: ${t.tablero}; color: ${p.text}; font-family: 'Instrument Sans', 'Segoe UI', system-ui, sans-serif; display: flex; flex-direction: column; gap: 36px">
<header style="display: flex; align-items: flex-end; gap: 48px">
<div style="flex: none; width: 560px; display: flex; flex-direction: column; gap: 10px">
<span style="font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${t.pri}">Opción ${t.opcion} · ${t.nombre}</span>
<h1 style="margin: 0; font-family: ${DISPLAY}; font-size: 44px; font-weight: 800; line-height: 1.05; letter-spacing: -0.02em">Modo ${mode}</h1>
<p style="margin: 0; font-size: 17px; line-height: 1.45; color: ${p.text2}">${t.descripcion}</p>
</div>
${withLogo ? logoBlock(t) : ''}<div style="flex: 1; display: flex; flex-direction: column; gap: 12px">
<div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 14px">
${SWATCHES.map(swatch).join('\n')}
</div>
<div style="display: flex; align-items: center; gap: 12px"><span style="flex: none; font-size: 13px; font-weight: 700">Hábitats</span>${t.hab.map(habitat).join('')}<span style="flex: none; font-size: 12.5px; color: ${p.text2}">Litoral · Humedales · Desierto · Sierra · Mar abierto</span></div>
</div>
</header>
<div style="display: flex; gap: 40px">
${SCREENS.map(phone).join('\n')}
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":2668,"height":1240}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
}

const written = [];
const write = async (name, text) => { await writeFile(join(PROJECT, name), text); written.push(name); };

// 1. Un artboard por tema.
for (const [themeId, t] of Object.entries(themes)) await write(fileFor(t), paletteArtboard(themeId, t));

if (withLogo) {
  // 2. Las pantallas de muestra conocen todos los temas.
  const options = JSON.stringify(Object.keys(themes));
  for (const [screen] of SCREENS) {
    let source = await readFile(join(PROJECT, `${screen}.dc.html`), 'utf8');
    source = source
      .replace(/^const TEMAS = \{.*\};$/m, () => `const TEMAS = ${JSON.stringify(themes)};`)
      .replace(/("tema":\{"editor":"enum","options":)\[[^\]]*\]/, (_, prefix) => prefix + options);
    if (screen === 'TemaLogin') {
      source = source.replace(/<img src="\/_blob\/3e0c4e5bb1d4a507fa3a0d73bd8a0ba0" alt="" style="width: 66px; height: 76px">/, () =>
        '<dc-import name="TemaLogo" variante="marca" size="76" tarjeta="{{t.logoTarjeta}}" doblez="{{t.logoDoblez}}" trazo="{{t.logoTrazo}}" sello="{{t.logoSello}}" estrella="{{t.logoEstrella}}" hint-size="66px,76px"></dc-import>');
    }
    await write(`${screen}.dc.html`, source);
  }

  // 3. canvas.json: las paletas nuevas debajo de las pantallas de muestra, y TemaLogo junto a ellas.
  const canvas = JSON.parse(await readFile(join(PROJECT, 'canvas.json'), 'utf8'));
  const onPage = Object.values(canvas.boards).filter((b) => b.page === 'paletas');
  let y = Math.max(...onPage.map((b) => b.y + b.h)) + 100;
  const newOptions = [...new Set(Object.values(themes).map((t) => t.opcion))].filter((o) => !canvas.boards[`Paleta${o}Claro.dc.html`]);
  for (const option of newOptions) {
    const light = Object.values(themes).find((t) => t.opcion === option && !t.oscuro);
    canvas.notes[`t-pal-${option.toLowerCase()}`] = { kind: 'title1', maxW: 2668, page: 'paletas', text: `Opción ${option} · ${light.nombre}: ${light.lema}`, x: 0, y };
    for (const [modeName, dy] of [['Claro', 300], ['Oscuro', 1640]]) {
      const file = `Paleta${option}${modeName}.dc.html`;
      canvas.boards[file] = { x: 0, y: y + dy, w: 2668, h: 1240, title: `Opción ${option} · ${light.nombre} · ${modeName.toLowerCase()}`, page: 'paletas' };
      if (!canvas.order.includes(file)) canvas.order.push(file);
    }
    y += 1640 + 1240 + 100;
  }
  const profile = canvas.boards['TemaPerfil.dc.html'];
  canvas.boards['TemaLogo.dc.html'] = { x: profile.x + profile.w + 80, y: profile.y, w: 120, h: 120, title: 'TemaLogo (componente con los colores del tema)', page: 'paletas' };
  if (!canvas.order.includes('TemaLogo.dc.html')) canvas.order.push('TemaLogo.dc.html');
  if (canvas.notes['t-pal-comp']) canvas.notes['t-pal-comp'].maxW = canvas.boards['TemaLogo.dc.html'].x + 120;
  await write('canvas.json', JSON.stringify(canvas, null, 2) + '\n');
}

console.log(`${written.length} archivos en ${PROJECT}:\n  ${written.join('\n  ')}`);
