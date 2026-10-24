// Config plugin: en Windows, compila el C++ de los módulos nativos con un CMake cuyo ninja admita
// rutas largas.
//
// CMake copia la ruta absoluta de cada fuente dentro de su carpeta de compilación, y con el código
// en D:\PROYECTOS\gepres\plumario-app\node_modules\… las carpetas de Reanimated pasan los 260
// caracteres. El CMake 3.22.1 que eligen los módulos por omisión trae ninja 1.10, que no admite
// rutas largas aunque Windows las tenga activadas (LongPathsEnabled): falla con «ninja: error:
// mkdir(…): No such file or directory». Desde CMake 3.30 (ninja 1.12) sí las admite.
//
// El plugin escribe cmake.dir en android/local.properties con el CMake ≥ 3.30 más nuevo del SDK.
// Fuera de Windows (EAS compila en Linux) no hace nada.
const fs = require('node:fs');
const path = require('node:path');

const { withDangerousMod } = require('expo/config-plugins');

const MINIMUM = [3, 30];

function newestCmake(sdk) {
  const dir = path.join(sdk, 'cmake');
  if (!fs.existsSync(dir)) return null;
  const versions = fs
    .readdirSync(dir)
    .map((name) => ({ name, parts: name.split('.').map(Number) }))
    .filter(({ parts }) => parts.length >= 2 && parts.every(Number.isFinite))
    .filter(({ parts }) => parts[0] > MINIMUM[0] || (parts[0] === MINIMUM[0] && parts[1] >= MINIMUM[1]))
    .sort((a, b) => b.parts[0] - a.parts[0] || b.parts[1] - a.parts[1] || (b.parts[2] ?? 0) - (a.parts[2] ?? 0));
  return versions.length ? path.join(dir, versions[0].name) : null;
}

// En .properties la barra invertida escapa: se duplica, y los dos puntos de la unidad también se escapan.
const escape = (value) => value.replace(/\\/g, '\\\\').replace(/:/g, '\\:');

module.exports = function withWindowsCmake(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      if (process.platform !== 'win32') return modConfig;
      const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
      const cmake = sdk ? newestCmake(sdk) : null;
      if (!cmake) {
        console.warn('No hay CMake 3.30 o superior en el SDK de Android: instálalo desde el SDK Manager (SDK Tools → CMake) o la compilación C++ fallará por rutas largas.');
        return modConfig;
      }
      const file = path.join(modConfig.modRequest.platformProjectRoot, 'local.properties');
      const kept = fs.existsSync(file)
        ? fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((line) => line && !line.startsWith('cmake.dir='))
        : [];
      fs.writeFileSync(file, [...kept, `cmake.dir=${escape(cmake)}`].join('\n') + '\n');
      return modConfig;
    },
  ]);
};
