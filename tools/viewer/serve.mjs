// Sirve viewer/index.html en http://localhost:4321/ (otro puerto con PORT=5000).
// No hace falta para verlo: el archivo también se abre con doble clic. Es para quien prefiera localhost.
// Uso: pnpm viewer:serve (desde la raíz).
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VIEWER = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'viewer', 'index.html');
const PORT = Number(process.env.PORT) || 4321;

createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path !== '/' && path !== '/index.html') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('No encontrado');
    return;
  }
  try {
    // Se lee en cada petición: tras regenerar el visor basta con recargar la página.
    const html = await readFile(VIEWER);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(html);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Falta viewer/index.html: genéralo con pnpm viewer');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Visor en http://localhost:${PORT}/`));
