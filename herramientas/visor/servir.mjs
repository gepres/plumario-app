// Sirve visor/index.html en http://localhost:4321/ (otro puerto con PUERTO=5000).
// No hace falta para verlo: el archivo también se abre con doble clic. Es para quien prefiera localhost.
// Uso: node herramientas/visor/servir.mjs
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VISOR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'visor', 'index.html');
const PUERTO = Number(process.env.PUERTO) || 4321;

createServer(async (req, res) => {
  const ruta = new URL(req.url, 'http://localhost').pathname;
  if (ruta !== '/' && ruta !== '/index.html') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('No encontrado');
    return;
  }
  try {
    // Se lee en cada petición: tras regenerar el visor basta con recargar la página.
    const html = await readFile(VISOR);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(html);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Falta visor/index.html: genéralo con node herramientas/visor/construir.mjs');
  }
}).listen(PUERTO, '127.0.0.1', () => console.log(`Visor en http://localhost:${PUERTO}/`));
