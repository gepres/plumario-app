# Plumario

App móvil de aves de Ica: registras un ave con una foto, la IA sugiere la especie, la pegas en el
álbum y ganas cromos, medallas y pósteres por hábitat. Stack en
`docs/architecture/adr-0001-stack.md`, arquitectura en `docs/architecture/adr-0002-hexagonal-architecture.md`,
entorno en `docs/environment.md`.

## Convenciones

- **Código en inglés, comentarios en español.** Archivos, carpetas de código, rutas, funciones,
  tipos, variables y claves en inglés. Comentarios, documentación y textos de la interfaz (la app es
  en español) en español con tildes. Lo que viene del canvas se queda como está: los nombres de los
  artboards (`TemaLogin.dc.html`, `PaletaFClaro.dc.html`…) y las claves de `palettes.json` y
  `canvas.json` son datos del diseño.
- **Arquitectura hexagonal.** El dominio y los casos de uso viven en `@plumario/core` y no
  dependen de nada. Las pantallas piden casos de uso con `useDependencies()`; solo
  `apps/mobile/src/infrastructure/` toca Firebase o cualquier adaptador. Una función nueva empieza
  por el núcleo (regla + caso de uso + puerto, con pruebas) y termina en adaptador y pantalla.
- **Componentes reutilizables en `@plumario/ui`.** Solo presentación: sin dominio, sin rutas, sin
  Firebase, y los textos visibles por props. Antes de crear un componente en la app, mira si es de
  la guía (`design/project/GuiaComponentes.dc.html`): entonces va en `packages/ui`.
- `pnpm check` corre lint, tipos, pruebas y `scripts/check-architecture.mjs`, que falla si una capa
  importa lo que no debe. Córrelo antes de dar algo por terminado.

## De dónde sale cada cosa

- **El diseño manda.** `design/project/*.dc.html` son los 90 artboards del diseño de Claude Design
  (origen y formato en `design/README.md`). Para verlos: `viewer/index.html` con doble clic. Cada
  pantalla pendiente dice qué artboards la definen (`ComingSoon`).
- **La paleta es la F · Ribera** (elegida el 24 oct 2026), en `design/palettes/palettes.json`
  (`f-claro`, `f-oscuro`). Llega a la app por `@plumario/tokens`: `packages/tokens/src/colors.ts`
  es generado; para cambiar un color, cámbialo en el JSON y corre `pnpm tokens`.
- **Las reglas de cromos, sobres y plumas están en `docs/card-progression.md`.** El acabado se gana, ya
  no depende de la especie. La fase 1 ya está en el núcleo; sobres, plumas e intercambio llegan en las
  fases 2A y 2B. Si el código y ese documento no coinciden, manda el documento. El intercambio está en
  pausa (`TRADES_PAUSED`): sus rutas muestran `TradePaused` y el servidor rechaza las aceptaciones.
- **Las ilustraciones de los stickers van dentro del paquete** (`apps/mobile/assets/stickers/`, en
  WebP), para que se vean sin señal. Los originales están en `data/stickers/raw/`, fuera de git; para
  espejar un ave o quitarle un resto de suelo, edita `tools/stickers/corrections.json` y corre
  `pnpm stickers:export`. La sombra sigue siendo la figura del grupo.
- **El arte y los datos de las cartas también van dentro del paquete.** El arte está en
  `apps/mobile/assets/cards/`, con sus originales en `data/cards/raw/`, fuera de git, y se recorta con
  `tools/cards/`. Peso, ala y textos salen de `pnpm species:cards`. Los textos son un borrador hasta que
  los apruebe el biólogo.
- **Las claves del diseño se traducen** con `designKeyMap` (en `colors.ts`): `{{t.sup}}` en un
  artboard es `colors.surface` en la app; `pri` → `primary`, `ink` → `text`, `txt2` →
  `textSecondary`, `hab` → `habitats`…

## Estructura

```
apps/mobile/                 app Expo (instrucciones de Expo en apps/mobile/AGENTS.md)
  src/app/                   rutas de expo-router — SOLO rutas (adaptadores de entrada)
  src/screens/               el cuerpo de las pantallas
  src/components/            componentes propios de la app (adaptadores de navegación, avisos)
  src/hooks/                 hooks que llaman a los casos de uso
  src/infrastructure/        adaptadores de salida y la raíz de composición (dependencies.tsx)
  scripts/generate-icons.mjs íconos desde el logo del diseño
packages/core/               @plumario/core: dominio, puertos, casos de uso
packages/ui/                 @plumario/ui: componentes reutilizables, tema y fuentes
packages/tokens/             @plumario/tokens: paleta, letra, espacio, cromos (generados)
functions/                   Cloud Functions (TypeScript)
data/                        catálogo de especies (ica.json) y su revisión de hábitats (ver data/README.md)
firebase/                    reglas e índices de Firestore y Storage
scripts/                     check-architecture y firebase-emulators
design/                      el diseño bajado del canvas y las paletas
viewer/                      el visor del diseño (viewer/index.html, con doble clic)
tools/                       scripts que generan el visor y las paletas
docs/                        ADR y entorno
```

## Comandos (desde la raíz)

```
pnpm install          instala todo el monorepo
pnpm dev              servidor de desarrollo de la app
pnpm android          compila e instala el build de desarrollo en el emulador
pnpm web              la app en el navegador (para revisar diseño; Firebase no corre ahí)
pnpm check            lint + tipos + pruebas + reglas de arquitectura
pnpm bundle-check     empaqueta la app para Android: caza los fallos de resolución
pnpm emulators        emuladores de Firebase con el proyecto demo-plumario
pnpm tokens           regenera los colores desde design/palettes/palettes.json
pnpm icons            regenera los íconos de la app desde el logo del diseño
pnpm species:convert  regenera data/species/ica.json desde el Excel y la tabla de hábitats
pnpm species:seed     carga el catálogo al emulador (--prod: al proyecto real, con hábitats revisados)
pnpm stickers:export  recorta las ilustraciones y las lleva a la app (WebP y su mapa por especie)
pnpm species:measures saca de AVONET el peso y las medidas de las aves del álbum
pnpm species:cards    genera card-facts.ts con los textos por familia y las medidas
pnpm viewer           regenera viewer/index.html desde design/
```

## Reglas

- Las dependencias de la app se agregan con `pnpm expo install <paquete>` dentro de `apps/mobile`:
  elige la versión que corresponde al SDK. Con `pnpm add` a secas se cuelan versiones que no casan.
- Antes de tocar una API de Expo, React Native o React Native Firebase, lee la documentación de la
  versión instalada (SDK 58, RN 0.88, RNFB 27): cambian en cada versión.
- Lo que se mueve (revelado de cromos, transiciones) se hace con Reanimated y se juzga en el
  teléfono, en build de publicación. Carga la skill `expo-animation` antes.
- Nada de secretos en la app: lo que necesite una clave (la IA) va en una Cloud Function.
- La app elige de dónde salen los datos con `EXPO_PUBLIC_DATA_SOURCE` en `apps/mobile/.env`
  (`memory`, `emulator` o `firebase`; ver `.env.example`). Con `emulator`: `pnpm emulators` y
  `pnpm species:seed` antes de abrir la app.
- `android/` e `ios/` se generan (`expo prebuild`); no se editan ni se versionan. Lo nativo se
  configura en `app.config.ts` y con config plugins.

## Lo que ya mordió

- **ESLint 10 rompe `eslint-plugin-react`** (`contextOrFilename.getFilename is not a function`).
  `expo install` lo trae si no se fija: la app usa ESLint 9.
- **TypeScript 6 ya no incluye los `@types` solos.** `app.config.ts` corre en Node y lo declara con
  `/// <reference types="node" />`; el código de la app no debe ver los tipos de Node.
- **`Link asChild` de expo-router no acepta un arreglo de estilos en el hijo**: lanza un error al
  renderizar. Aplanarlo con `StyleSheet.flatten` o navegar con `router.push`.
- **En web, un `<svg>` sin posición queda tapado por un hermano con posición absoluta.**
  `GradientView` abre su contexto de apilado y manda el degradado al fondo; no lo quites.
- **Los tipos de rutas (`.expo/types`) se regeneran al arrancar Metro.** Tras renombrar una ruta,
  `tsc` falla con la ruta vieja hasta correr `pnpm dev` una vez.
- **No toques `metro.config.js` para el monorepo.** Expo lo configura solo; desactivar la búsqueda
  jerárquica rompió el empaquetado en `archetypes-mobile`.
- **React Native Firebase 27 pide Kotlin 2.4** (su SDK de Android viene compilado con él); Expo trae
  el 2.2. `app.config.ts` lo fija con `expo-build-properties`.
- **Windows y las rutas de más de 260 caracteres:** el ninja del CMake 3.22.1 rompe el C++ de
  Reanimated (`ninja: error: mkdir(…)`). `plugins/with-windows-cmake.js` fija un CMake ≥ 3.30 en
  `local.properties` en cada prebuild; no lo quites.
- **La primera compilación de Android es lenta en esta máquina:** la caché de Gradle está en `C:`
  y el proyecto en `D:`, y no hay enlaces duros entre discos. *"Hard link … failed. Doing a slower
  copy instead"* no es un error.
- **Los emuladores de Firebase piden Java 21+ y Android usa el 17.** `pnpm emulators` le pasa a la
  CLI de Firebase el Java de Android Studio sin tocar `JAVA_HOME`; no corras `firebase` a secas.
- **Emulador sin servidor:** `adb reverse tcp:8081 tcp:8081`.
- **Metro se cuelga si arranca mientras Gradle compila.** Sin Watchman, su vigilante
  (`FallbackWatcher`) procesa uno a uno los miles de archivos que Gradle crea y borra, y deja de
  responder (ni `/status`). Arranca Metro después de `pnpm android`, o reinícialo al terminar.
- **La cámara del emulador saca fotos negras** con la hora en amarillo: es la cámara virtual, no la
  app. Para ver una foto de verdad, usa la galería o un teléfono.
- **Las Functions corren con Node 22**, no 24: el trigger de Auth es de primera generación, que no
  admite Node 24 ni la región de Santiago (va a `southamerica-east1`).
- **`setGlobalOptions` va en `functions/src/setup.ts`, importado primero.** Las funciones invocables
  toman la región al definirse, y los módulos que las definen se evalúan antes que el cuerpo de
  `index.ts`: ahí quedaban en `us-central1`. El emulador guarda las regiones de la primera carga:
  tras cambiarlas, reinícialo.
- **`pnpm install` falla con Metro abierto** (`ENOENT … raw-body_tmp_…`): Metro tiene abiertos
  archivos de `node_modules` y Windows no deja moverlos. Detén Metro (y los emuladores) antes de
  instalar.
- **El plugin de messaging solo nombra el ícono de las notificaciones** (`@drawable/notification_icon`)
  y no lo crea: sin `plugins/with-notification-icon.js` la compilación falla. Y sin declarar
  `POST_NOTIFICATIONS` en `app.config.ts`, Android 13 ni siquiera muestra el diálogo de permiso.
- **No dejes la terminal dentro de `apps/mobile/android`**: `expo prebuild --clean` no puede borrar
  la carpeta (`EBUSY`).
- **Gemini a veces está saturado** (503 o más de 15 s). `functions/src/gemini.ts` pasa a
  `gemini-3.5-flash-lite` y vuelve a probar; no subas el tiempo de espera: alguien mira la pantalla.

## Tablero

El trabajo se refleja en el tablero «Plumario · app» de Foundry (clave PA). Carga la skill
`foundry-tablero` antes de operarlo.
