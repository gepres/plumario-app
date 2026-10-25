# Entorno de desarrollo

Todo lo que hace falta para levantar Plumario en una máquina nueva, y lo que se aprendió al
montarlo. Las razones de cada pieza están en `docs/architecture/`.

## Herramientas

| Herramienta | Versión | Para qué | Comprobar |
|---|---|---|---|
| Node.js | 24 o superior (probado con 24.10) | todo el monorepo | `node --version` |
| pnpm | 10.12.4 (fijado en `packageManager`) | instalar y correr scripts | `pnpm --version` |
| Git | cualquiera reciente | — | `git --version` |
| JDK | 17 (`JAVA_HOME`) | compilar Android | `java -version` |
| Java 21 o superior | el de Android Studio (`jbr`, hoy el 25) | emuladores de Firestore, Auth y Storage | lo busca `pnpm emulators` |
| Android SDK | plataforma 36, build-tools 36, NDK 27, **CMake 3.30 o superior** | compilar e instalar en el emulador | Android Studio → SDK Manager |
| Emulador Android | un Pixel con API 35 o 36 | probar la app | `emulator -list-avds` |
| EAS CLI | 18.4 o superior | builds en la nube (iOS siempre) | `npx eas-cli --version` |
| Firebase CLI | la del proyecto (`firebase-tools` en la raíz) | emuladores y despliegue | `pnpm exec firebase --version` |
| Docker | no hace falta | — | — |

En Windows no se compila iOS en local: los builds de iOS salen por EAS Build. Compilar iOS en una
Mac exigiría Xcode 26.2 en macOS 15 o posterior (lo pide el SDK de Firebase para Apple).

Variables de entorno de Android (ya están en esta máquina):

```
ANDROID_HOME = C:\Users\<usuario>\AppData\Local\Android\Sdk
PATH += %ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator
JAVA_HOME = C:\Program Files\Java\jdk-17
```

## Primera vez

```bash
pnpm install
pnpm check          # lint, tipos y pruebas: todo en verde antes de empezar
pnpm android        # genera android/, compila el build de desarrollo y lo instala en el emulador
```

`pnpm android` deja instalado el **build de desarrollo** (no Expo Go: React Native Firebase lleva
código nativo). Después basta con `pnpm dev`. Solo hay que recompilar al cambiar algo nativo:
agregar una librería con código nativo, tocar `app.config.ts` o los archivos de Firebase.

Para revisar diseño sin compilar: `pnpm web` abre la app en el navegador. Ahí Firebase no corre.

## Firebase

### Proyecto en la consola

El proyecto es **`plumario-app`** (número 155417952770), con las apps Android e iOS
`com.gepres.plumario` registradas. En `.firebaserc` es el alias `prod`; `demo-plumario` sigue de
predeterminado para que los emuladores corran sin tocar el proyecto real.

1. ~~Crear el proyecto~~ y ~~registrar las dos apps~~: hecho. Sus archivos van en
   `apps/mobile/firebase/` (`google-services.json` y `GoogleService-Info.plist`; git los ignora en
   cualquier carpeta).
2. ~~Crear la base de datos~~: hecho. Quedó en **`nam5`** (multirregión en EE. UU.; la consola no
   dejó elegir) y se conserva. Las Functions van en `us-central1` (`functions/src/health.ts`), junto a ella.
3. ~~Pasar al plan Blaze~~: hecho.
4. Activar Authentication con correo y contraseña, Google y Apple.
5. Dar acceso a la CLI: `pnpm exec firebase login:add` con la cuenta dueña de `plumario-app` (la
   sesión actual de esta máquina es de otra cuenta y recibe 403).
6. Recompilar la app (`pnpm android`): `app.config.ts` ve los dos archivos y activa los plugins
   nativos (con uno solo, avisa cuál falta y compila sin Firebase).
   La pantalla «Sistema visual» (Perfil → Ver el sistema visual) dice si la build lleva Firebase.
   Después, los adaptadores de Firestore se eligen en `apps/mobile/src/infrastructure/dependencies.tsx`.

Los dos archivos de configuración no se versionan. En EAS se suben como variables de entorno de
tipo archivo y `app.config.ts` las lee:

```bash
npx eas-cli env:create --name GOOGLE_SERVICES_JSON --type file --value ./firebase/google-services.json --environment development --environment preview --environment production --visibility secret
npx eas-cli env:create --name GOOGLE_SERVICES_PLIST --type file --value ./firebase/GoogleService-Info.plist --environment development --environment preview --environment production --visibility secret
```

### Emuladores

```bash
pnpm emulators
```

Compila `functions/` y levanta Auth, Firestore, Storage y Functions con el proyecto
`demo-plumario`. El prefijo `demo-` hace que corran sin proyecto real ni conexión, y que un
despliegue a ese proyecto sea imposible. La interfaz queda en <http://localhost:4000> y la función
de prueba en <http://127.0.0.1:5001/demo-plumario/us-central1/health>.

Los emuladores separan datos, reglas y triggers por proyecto. Con `EXPO_PUBLIC_DATA_SOURCE=emulator`
la app no usa el proyecto de su `google-services.json`: crea una app de Firebase secundaria con
`demo-plumario` (`apps/mobile/src/infrastructure/firebase/firebase-services.ts`), así que lo que
escribe cae donde están las reglas, el catálogo de `pnpm species:seed` y los triggers de Functions.

Para probar el álbum, las recompensas o los pósteres sin registrar ave por ave,
`pnpm dev:stickers <correo>` le da a una cuenta del emulador stickers de muestra, con un cromado
de cada categoría (`--count N` para más y `--clear` para quitarlos). Solo escribe en el emulador.

Para probar un intercambio sin otro teléfono, `pnpm dev:trade <correo>` crea a @beto.ica con los
stickers que hacen falta y una propuesta para esa cuenta, e imprime el enlace
(`adb shell am start -a android.intent.action.VIEW -d "plumario://trade/<id>" com.gepres.plumario`).

Los datos de los emuladores se guardan en `.emulator-data` al salir con Ctrl+C. Si el proceso se
corta de otra forma (por ejemplo, al matarlo desde otra terminal) no se guardan: antes de reiniciar,
`pnpm emulators:export`. Una función con un trigger de Firestore **nuevo** se carga en caliente,
pero el emulador de Firestore no le manda eventos hasta reiniciar los emuladores.

`firebase-tools` 15 exige **Java 21 o superior** para los emuladores, pero Android compila con el
JDK 17 de `JAVA_HOME`. `scripts/firebase-emulators.mjs` resuelve el choque sin tocar el
sistema: si `JAVA_HOME` es menor que 21, usa el Java de Android Studio (`jbr`) o el que diga
`FIREBASE_JAVA_HOME`, solo para la CLI de Firebase. Cualquier otro comando de la CLI pasa por el
mismo script: `pnpm emulators emulators:exec "<comando>"`.

### Cuentas (Auth)

- **Correo y contraseña**: hay que activar el proveedor en la consola (Authentication → Sign-in
  method). En el emulador ya está.
- **Enlace para crear contraseña**: por omisión, el correo de Firebase lleva a su propia página web,
  donde se puede cambiar la contraseña sin la app. Para que abra NuevaContrasena dentro de la app,
  la URL de acción de la plantilla (Authentication → Templates → Password reset) tiene que terminar
  en `plumario://new-password?oobCode=…`, por ejemplo con una página de Hosting que redirija. Para
  probarlo con el emulador: pide el enlace desde la app, toma el `oobCode` de
  <http://127.0.0.1:9099/emulator/v1/projects/demo-plumario/oobCodes> y ábrelo con
  `adb shell am start -a android.intent.action.VIEW -d "plumario://new-password?oobCode=<código>"`.
- **Google y Apple**: los botones están, pero falta configurar los proveedores en la consola (y la
  cuenta de Apple Developer); por ahora avisan que llegan pronto.

## EAS

```bash
cd apps/mobile
npx eas-cli login
npx eas-cli init                                  # crea el proyecto en expo.dev y escribe su id
npx eas-cli build --profile development --platform android
npx eas-cli build --profile development --platform ios     # necesita cuenta de Apple Developer
```

Perfiles en `apps/mobile/eas.json`: `development` (build de desarrollo, distribución interna),
`development-simulator` (iOS en simulador), `preview` (APK interno para probar) y `production`
(tiendas, con número de versión automático).

## Problemas conocidos

- **La primera compilación de Android tarda mucho.** La caché de Gradle está en `C:` y el
  proyecto en `D:`; sin enlaces duros entre discos, cada librería se copia entera. *"Hard link …
  failed. Doing a slower copy instead"* no es un error.
- **Rutas de más de 260 caracteres al compilar C++ en Windows** (`ninja: error: mkdir(…/react-native-reanimated/Common/NativeView/…): No such file or directory`).
  CMake copia la ruta absoluta del código dentro de su carpeta de compilación y las carpetas de
  Reanimated pasan el límite. El ninja del CMake 3.22.1 que eligen los módulos por omisión no
  admite rutas largas aunque Windows las tenga activadas (`LongPathsEnabled`, ya activo en esta
  máquina); el de CMake 3.30 o superior sí. `apps/mobile/plugins/with-windows-cmake.js` escribe
  `cmake.dir` en `android/local.properties` con el CMake ≥ 3.30 más nuevo del SDK (aquí, 3.31.6) en
  cada `prebuild`. Si falta, instalarlo en Android Studio → SDK Manager → SDK Tools → CMake.
- **Kotlin 2.4 para React Native Firebase 27:** su SDK de Android está compilado con Kotlin 2.4 y
  con el 2.2 de Expo falla (`incompatible version of Kotlin … expected 2.2.0`). `app.config.ts`
  fija `android.kotlinVersion` en 2.4.0 con `expo-build-properties`; no lo quites.
- **El emulador no encuentra el servidor de desarrollo:** `adb reverse tcp:8081 tcp:8081` y abrir
  de nuevo la app.
- **«RNFBAppModule not found»:** el build instalado es anterior a React Native Firebase.
  Desinstalarlo del emulador y volver a `pnpm android`.
- **«Firebase queda desactivado en esta build: falta …»** al compilar: hay archivo de configuración
  para una plataforma y no para la otra. Los plugins de React Native Firebase se registran para las
  dos a la vez, así que `app.config.ts` solo los activa con los dos archivos. Descargar el que falta.
- **«Unexpected rules runtime error: WARNING: A terminally deprecated method in sun.misc.Unsafe»**
  al arrancar Storage: es un aviso de Java 25, no un error. Las reglas se evalúan bien.
- **«firebase-tools no longer supports Java version before 21»:** se corrió `firebase` a secas con
  el JDK 17. Usar `pnpm emulators`.
- **ESLint 10 rompe `eslint-plugin-react`:** la app fija ESLint 9 (`expo install` traería el 10).
- **pnpm instala con `nodeLinker: hoisted`** (`node_modules` plano, como npm). Es a propósito:
  la instalación aislada rompe la resolución de algunas librerías nativas.
