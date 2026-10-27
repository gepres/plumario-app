// Arma la web del piloto de stickers para compartirla en Netlify: exporta la app web con los
// datos de muestra en memoria (no se conecta a Firebase) y le suma las redirecciones (el enlace
// abre directo en /sticker-pilot) y el esqueleto del formulario de opiniones.
// Uso (desde la raíz): node tools/stickers/pilot/build-share.mjs <carpeta de salida>
import { spawnSync } from 'node:child_process';
import { copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const out = process.argv[2];
if (!out) throw new Error('Uso: node tools/stickers/pilot/build-share.mjs <carpeta de salida>');
const target = resolve(out);

// Una sola línea de comando: en Windows npx es un .cmd y necesita la consola.
const result = spawnSync(`npx expo export --platform web --output-dir "${target}" --clear`, {
  cwd: join(ROOT, 'apps', 'mobile'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, EXPO_PUBLIC_DATA_SOURCE: 'memory' },
});
if (result.status !== 0) process.exit(result.status ?? 1);

for (const file of ['_redirects', '__forms.html']) await copyFile(join(HERE, 'share', file), join(target, file));
console.log(`Listo para Netlify: ${target}`);
