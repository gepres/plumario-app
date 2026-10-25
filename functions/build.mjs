// Arma en dist/ el paquete que despliega Firebase (firebase.json → functions.source):
// - index.js: src/index.ts empaquetado con esbuild. El núcleo (@plumario/core, TypeScript del
//   monorepo) va adentro: Cloud Functions instala con npm y no conoce el espacio de trabajo.
// - package.json: solo las dependencias de ejecución (firebase-admin y firebase-functions), que
//   quedan fuera del paquete y se instalan al desplegar.
import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { build } from 'esbuild';

const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url), 'utf8'));
const external = Object.keys(pkg.dependencies).flatMap((name) => [name, `${name}/*`]);

// Se sobrescribe sin borrar la carpeta: en Windows el emulador de Functions la tiene abierta.
await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  sourcemap: true,
  external,
  logLevel: 'info',
});
await writeFile(
  'dist/package.json',
  `${JSON.stringify({ name: pkg.name, private: true, type: 'module', main: 'index.js', engines: pkg.engines, dependencies: pkg.dependencies }, null, 2)}\n`,
);
