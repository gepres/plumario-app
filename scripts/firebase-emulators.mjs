// Corre la CLI de Firebase con un Java que le sirva a los emuladores, sin tocar el del sistema.
// Uso: pnpm emulators                     → emulators:start con el proyecto demo-plumario,
//                                           importando y exportando .emulator-data
//      pnpm emulators emulators:exec "…"  → cualquier otro comando de la CLI
//
// firebase-tools 15 exige Java 21 o superior para los emuladores de Firestore, Auth y Storage, y
// la compilación de Android usa el JDK 17 de JAVA_HOME. Si JAVA_HOME es menor que 21, se usa el
// Java que trae Android Studio (jbr), o el que diga FIREBASE_JAVA_HOME.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { delimiter, join } from 'node:path';

const MINIMUM = 21;
const DATA_DIR = '.emulator-data';
const executable = process.platform === 'win32' ? 'java.exe' : 'java';

function javaVersion(home) {
  const java = join(home, 'bin', executable);
  if (!existsSync(java)) return 0;
  // `java -version` escribe en stderr: «openjdk version "25.0.2"» o «java version "17.0.12"».
  const { stderr } = spawnSync(java, ['-version'], { encoding: 'utf8' });
  return Number(/version "(\d+)/.exec(stderr ?? '')?.[1] ?? 0);
}

const candidates = [
  process.env.FIREBASE_JAVA_HOME,
  process.env.JAVA_HOME,
  'C:\\Program Files\\Android\\Android Studio\\jbr',
  '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
  '/opt/android-studio/jbr',
].filter(Boolean);

const javaHome = candidates.find((home) => javaVersion(home) >= MINIMUM);
if (!javaHome) {
  console.error(`Los emuladores de Firebase necesitan Java ${MINIMUM} o superior y no se encontró ninguno.`);
  console.error('Instala Android Studio (trae uno) o un JDK 21, y apúntalo con FIREBASE_JAVA_HOME.');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  // Los datos del emulador (cuentas, registros, stickers) se guardan en .emulator-data al cerrar y
  // se vuelven a cargar al abrir, para no perderlos entre sesiones. Para empezar de cero, borra la carpeta.
  args.push('emulators:start', '--export-on-exit', DATA_DIR);
  if (existsSync(DATA_DIR)) args.push('--import', DATA_DIR);
}
if (!args.includes('--project')) args.push('--project', 'demo-plumario');

// El binario de firebase-tools se corre con este mismo Node y sin shell: en Windows, con shell,
// un argumento con espacios (el comando de emulators:exec) llega partido.
const firebase = createRequire(import.meta.url).resolve('firebase-tools/lib/bin/firebase.js');

console.log(`Java ${javaVersion(javaHome)} de ${javaHome}`);
const child = spawn(process.execPath, [firebase, ...args], {
  stdio: 'inherit',
  env: { ...process.env, JAVA_HOME: javaHome, PATH: join(javaHome, 'bin') + delimiter + process.env.PATH },
});
child.on('exit', (code) => process.exit(code ?? 1));
