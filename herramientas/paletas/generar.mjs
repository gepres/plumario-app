// Genera los artboards de la página «Paletas» del canvas desde diseno/paletas/paletas.json.
// Uso: node herramientas/paletas/generar.mjs <carpeta> [--sin-logo]
//   <carpeta>/project/ tiene la copia recién leída del canvas (canvas.json y Tema*.dc.html).
//   Escribe ahí Paleta<X><Modo>.dc.html por cada tema, pone los 10 temas en las pantallas
//   Tema*, cambia el logo fijo de TemaLogin por TemaLogo y añade lo nuevo a canvas.json.
//   --sin-logo genera las paletas sin el bloque del logo (para comparar con las originales).
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const carpeta = process.argv[2];
const conLogo = !process.argv.includes('--sin-logo');
if (!carpeta) {
  console.error('Uso: node herramientas/paletas/generar.mjs <carpeta> [--sin-logo]');
  process.exit(1);
}
const PROYECTO = join(carpeta, 'project');
const temas = JSON.parse(await readFile(join(RAIZ, 'diseno', 'paletas', 'paletas.json'), 'utf8'));

const PANTALLAS = [
  ['TemaLogin', 'Iniciar sesión'],
  ['TemaInicio', 'Inicio'],
  ['TemaAlbum', 'Álbum'],
  ['TemaRevelar', 'Cromo revelado'],
  ['TemaRecompensas', 'Recompensas'],
  ['TemaPerfil', 'Perfil']
];
const MUESTRAS = [
  ['Fondo', 'bg'], ['Superficie', 'sup'], ['Superficie 2', 'sup2'], ['Texto', 'ink'], ['Texto 2', 'txt2'], ['Línea', 'linea'],
  ['Primario', 'pri'], ['Acento', 'acento'], ['Sol', 'sol'], ['Éxito', 'exito'], ['Aviso', 'aviso'], ['Error', 'error']
];
// Colores del lienzo de presentación, no de la paleta.
const PRESENTACION = {
  claro: { texto: '#14181C', texto2: '#4E5660', marco: '0 0 0 8px #FFFFFF, 0 24px 50px rgba(0,0,0,0.16)' },
  oscuro: { texto: '#F1F3F6', texto2: '#A7B0BA', marco: '0 0 0 8px #1B2026, 0 24px 50px rgba(0,0,0,0.5)' }
};
const DISPLAY = "'Bricolage Grotesque', 'Avenir Next', system-ui, sans-serif";

const archivoDe = (t) => `Paleta${t.opcion}${t.modo}.dc.html`;
const colores = (t) => `tarjeta="${t.logoTarjeta}" doblez="${t.logoDoblez}" trazo="${t.logoTrazo}" sello="${t.logoSello}" estrella="${t.logoEstrella}"`;

function bloqueLogo(t, p) {
  return `<div style="flex: none; display: flex; gap: 16px">
<figure style="margin: 0; display: flex; flex-direction: column; align-items: center; gap: 8px"><dc-import name="TemaLogo" variante="icono" size="112" fondo="${t.logoIcono}" ${colores(t)} hint-size="112px,112px"></dc-import><figcaption style="font-size: 13px; font-weight: 700">Ícono de la app</figcaption></figure>
<figure style="margin: 0; display: flex; flex-direction: column; align-items: center; gap: 8px"><div style="width: 112px; height: 112px; border-radius: 24px; background: ${t.hero}; display: flex; align-items: center; justify-content: center"><dc-import name="TemaLogo" variante="marca" size="80" ${colores(t)} hint-size="70px,80px"></dc-import></div><figcaption style="font-size: 13px; font-weight: 700">En la portada</figcaption></figure>
</div>
`;
}

function paleta(clave, t) {
  const modo = t.oscuro ? 'oscuro' : 'claro';
  const p = PRESENTACION[modo];
  const muestra = ([n, k]) => `<div style="display: flex; flex-direction: column; gap: 6px"><span aria-hidden="true" style="height: 56px; border-radius: 12px; background: ${t[k]}; box-shadow: inset 0 0 0 1px rgba(127,127,127,0.25)"></span><span style="font-size: 13px; font-weight: 700">${n}</span><span style="font-size: 12px; color: ${p.texto2}">${t[k]}</span></div>`;
  const habitat = (c) => `<span aria-hidden="true" style="flex: 1; height: 14px; border-radius: 4px; background: ${c}"></span>`;
  const telefono = ([nombre, pie]) => `<figure style="margin: 0; display: flex; flex-direction: column; gap: 12px"><div style="width: 390px; height: 844px; border-radius: 32px; overflow: hidden; box-shadow: ${p.marco}"><dc-import name="${nombre}" tema="${clave}" hint-size="390px,844px"></dc-import></div><figcaption style="padding-top: 8px; font-size: 15px; font-weight: 700; text-align: center">${pie}</figcaption></figure>`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Opción ${t.opcion} · ${t.nombre} · modo ${modo}</title>
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
<div style="width: 2668px; height: 1240px; box-sizing: border-box; overflow: hidden; padding: 52px 64px; background: ${t.tablero}; color: ${p.texto}; font-family: 'Instrument Sans', 'Segoe UI', system-ui, sans-serif; display: flex; flex-direction: column; gap: 36px">
<header style="display: flex; align-items: flex-end; gap: 48px">
<div style="flex: none; width: 560px; display: flex; flex-direction: column; gap: 10px">
<span style="font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${t.pri}">Opción ${t.opcion} · ${t.nombre}</span>
<h1 style="margin: 0; font-family: ${DISPLAY}; font-size: 44px; font-weight: 800; line-height: 1.05; letter-spacing: -0.02em">Modo ${modo}</h1>
<p style="margin: 0; font-size: 17px; line-height: 1.45; color: ${p.texto2}">${t.descripcion}</p>
</div>
${conLogo ? bloqueLogo(t, p) : ''}<div style="flex: 1; display: flex; flex-direction: column; gap: 12px">
<div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 14px">
${MUESTRAS.map(muestra).join('\n')}
</div>
<div style="display: flex; align-items: center; gap: 12px"><span style="flex: none; font-size: 13px; font-weight: 700">Hábitats</span>${t.hab.map(habitat).join('')}<span style="flex: none; font-size: 12.5px; color: ${p.texto2}">Litoral · Humedales · Desierto · Sierra · Mar abierto</span></div>
</div>
</header>
<div style="display: flex; gap: 40px">
${PANTALLAS.map(telefono).join('\n')}
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

const escritos = [];
const escribir = async (nombre, texto) => { await writeFile(join(PROYECTO, nombre), texto); escritos.push(nombre); };

// 1. Un artboard por tema.
for (const [clave, t] of Object.entries(temas)) await escribir(archivoDe(t), paleta(clave, t));

if (conLogo) {
  // 2. Las pantallas de muestra conocen los 10 temas.
  const opciones = JSON.stringify(Object.keys(temas));
  for (const [nombre] of PANTALLAS) {
    let fuente = await readFile(join(PROYECTO, `${nombre}.dc.html`), 'utf8');
    fuente = fuente
      .replace(/^const TEMAS = \{.*\};$/m, () => `const TEMAS = ${JSON.stringify(temas)};`)
      .replace(/("tema":\{"editor":"enum","options":)\[[^\]]*\]/, (_, a) => a + opciones);
    if (nombre === 'TemaLogin') {
      fuente = fuente.replace(/<img src="\/_blob\/3e0c4e5bb1d4a507fa3a0d73bd8a0ba0" alt="" style="width: 66px; height: 76px">/, () =>
        '<dc-import name="TemaLogo" variante="marca" size="76" tarjeta="{{t.logoTarjeta}}" doblez="{{t.logoDoblez}}" trazo="{{t.logoTrazo}}" sello="{{t.logoSello}}" estrella="{{t.logoEstrella}}" hint-size="66px,76px"></dc-import>');
    }
    await escribir(`${nombre}.dc.html`, fuente);
  }

  // 3. canvas.json: las paletas nuevas debajo de las pantallas de muestra, y TemaLogo junto a ellas.
  const canvas = JSON.parse(await readFile(join(PROYECTO, 'canvas.json'), 'utf8'));
  const enPagina = Object.values(canvas.boards).filter((b) => b.page === 'paletas');
  let y = Math.max(...enPagina.map((b) => b.y + b.h)) + 100;
  const opcionesNuevas = [...new Set(Object.values(temas).map((t) => t.opcion))].filter((o) => !canvas.boards[`Paleta${o}Claro.dc.html`]);
  for (const o of opcionesNuevas) {
    const claro = Object.values(temas).find((t) => t.opcion === o && !t.oscuro);
    canvas.notes[`t-pal-${o.toLowerCase()}`] = { kind: 'title1', maxW: 2668, page: 'paletas', text: `Opción ${o} · ${claro.nombre}: ${claro.lema}`, x: 0, y };
    for (const [modo, dy] of [['Claro', 300], ['Oscuro', 1640]]) {
      const archivo = `Paleta${o}${modo}.dc.html`;
      canvas.boards[archivo] = { x: 0, y: y + dy, w: 2668, h: 1240, title: `Opción ${o} · ${claro.nombre} · ${modo.toLowerCase()}`, page: 'paletas' };
      if (!canvas.order.includes(archivo)) canvas.order.push(archivo);
    }
    y += 1640 + 1240 + 100;
  }
  const perfil = canvas.boards['TemaPerfil.dc.html'];
  canvas.boards['TemaLogo.dc.html'] = { x: perfil.x + perfil.w + 80, y: perfil.y, w: 120, h: 120, title: 'TemaLogo (componente con los colores del tema)', page: 'paletas' };
  if (!canvas.order.includes('TemaLogo.dc.html')) canvas.order.push('TemaLogo.dc.html');
  if (canvas.notes['t-pal-comp']) canvas.notes['t-pal-comp'].maxW = canvas.boards['TemaLogo.dc.html'].x + 120;
  await escribir('canvas.json', JSON.stringify(canvas, null, 2) + '\n');
}

console.log(`${escritos.length} archivos en ${PROYECTO}:\n  ${escritos.join('\n  ')}`);
