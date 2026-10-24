// Hace cumplir las reglas de la arquitectura hexagonal leyendo los imports del código.
// Uso: pnpm check:architecture (también corre al final de pnpm check). Sale con 1 si algo las rompe.
//
// Con pnpm en modo hoisted, cualquier paquete resuelve cualquier dependencia de la raíz: sin este
// chequeo, el núcleo podría importar React o Firebase y compilaría igual.
//
// Los imports se leen con el preprocesador de TypeScript (ve import estático y dinámico, require y
// export … from, e ignora comentarios). Los relativos y el alias @/ se resuelven al archivo de
// destino, para que «../infrastructure/…» no se salte la regla que sí ve «@/infrastructure/…».
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const MOBILE_SRC = join(ROOT, 'apps', 'mobile', 'src');
const INFRASTRUCTURE = join(MOBILE_SRC, 'infrastructure');
const COMPOSITION_ROOT = join(INFRASTRUCTURE, 'dependencies');

const inside = (path, dir) => path === dir || path.startsWith(dir + sep);

/** Un import es un archivo del repo (`path`) o un paquete (`pkg`). */
function target(spec, file) {
  if (spec.startsWith('.')) return { path: resolve(dirname(file), spec) };
  if (spec.startsWith('@/')) return { path: join(MOBILE_SRC, spec.slice(2)) };
  const parts = spec.split('/');
  return { pkg: spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0], deep: parts.length > (spec.startsWith('@') ? 2 : 1) };
}

const RULES = [
  {
    dir: 'packages/core/src',
    why: 'el núcleo (dominio, puertos, casos de uso) no depende de ningún paquete ni sale de su carpeta',
    allows: (t, dir) => t.path !== undefined && inside(t.path, dir),
  },
  {
    dir: 'packages/tokens/src',
    why: 'los tokens son datos: no dependen de ningún paquete ni salen de su carpeta',
    allows: (t, dir) => t.path !== undefined && inside(t.path, dir),
  },
  {
    dir: 'packages/ui/src',
    why: 'la UI es solo presentación: ni dominio, ni rutas, ni Firebase',
    allows: (t, dir) => {
      if (t.path !== undefined) return inside(t.path, dir);
      return ['react', 'react-native', 'react-native-svg', 'react-native-safe-area-context', '@plumario/tokens'].includes(t.pkg) || t.pkg.startsWith('@expo-google-fonts/');
    },
  },
  {
    dir: 'apps/mobile/src',
    why: 'fuera de src/infrastructure solo se usa la raíz de composición (dependencies); Firebase vive en src/infrastructure; los paquetes del monorepo se usan por su entrada pública',
    allows: (t, dir, file) => {
      const fromInfrastructure = inside(file, INFRASTRUCTURE);
      if (t.path !== undefined) {
        if (!inside(t.path, dir)) return false;
        return fromInfrastructure || !inside(t.path, INFRASTRUCTURE) || t.path.replace(/\.tsx?$/, '') === COMPOSITION_ROOT;
      }
      if (t.pkg.startsWith('@react-native-firebase/')) return fromInfrastructure;
      if (t.pkg.startsWith('@plumario/')) return !t.deep;
      return true;
    },
  },
  {
    dir: 'functions/src',
    why: 'las Functions no usan paquetes de la app ni de React',
    allows: (t, dir) => (t.path !== undefined ? inside(t.path, dir) : !['react', 'react-native', '@plumario/ui', '@plumario/tokens'].includes(t.pkg)),
  },
];

async function* sourceFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(path);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) yield path;
  }
}

let violations = 0;
let checked = 0;
for (const rule of RULES) {
  const dir = join(ROOT, rule.dir);
  for await (const file of sourceFiles(dir)) {
    checked++;
    const { importedFiles } = ts.preProcessFile(await readFile(file, 'utf8'), true, true);
    for (const { fileName: spec } of importedFiles) {
      if (spec.startsWith('node:') && rule.dir === 'functions/src') continue;
      if (!rule.allows(target(spec, file), dir, file)) {
        violations++;
        console.error(`✗ ${relative(ROOT, file)} importa «${spec}»: ${rule.why}.`);
      }
    }
  }
}

console.log(`${checked} archivos revisados, ${violations} violaciones de arquitectura.`);
process.exitCode = violations ? 1 : 0;
