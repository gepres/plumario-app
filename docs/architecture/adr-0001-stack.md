# ADR-0001 · Stack de Plumario

- **Estado:** aceptado por el usuario el 24 oct 2026.
- **Tarjeta:** PA-8 en el tablero «Plumario · app» de Foundry.

## Contexto

Plumario es un álbum de aves de Ica: registras un ave con una foto, la IA sugiere la especie, la
pegas en el álbum y ganas cromos, medallas y pósteres por hábitat. El diseño completo está en
`diseno/` (64 artboards del canvas de Claude Design) y la paleta elegida es la **F · Ribera**
(claro con fondo blanco, oscuro carbón).

El usuario pidió una propuesta de herramientas y eligió entre opciones. Lo que piden las pantallas
del diseño es lo que decide cada pieza:

| Lo que pide el diseño | Pantallas | Pieza | Hoy |
|---|---|---|---|
| Entrar con correo, Google y Apple | `Login`, `Registro`, `OlvideContrasena` | Firebase Auth (`@react-native-firebase/auth`) + `@react-native-google-signin/google-signin` + `expo-apple-authentication` | Auth instalado; Google y Apple, por instalar |
| Tomar o elegir la foto | `RegistrarCamara` | `expo-image-picker` (y `expo-camera` si hace falta cámara propia) | por instalar |
| «La IA sugiere» la especie | `RegistrarIdentificar` | Cloud Function que llama a un modelo de visión: la clave nunca va en la app | proveedor por decidir |
| Guardar y mostrar fotos | `GaleriaEspecie`, `CompartirTarjeta` | Cloud Storage (`@react-native-firebase/storage`), `expo-image`, `expo-image-manipulator` para reducirlas | Storage y expo-image instalados |
| Ubicación privada; especies amenazadas siempre ocultas | `PerfilPrivacidad` | `expo-location` solo para asignar la región; reglas de Firestore que nunca la exponen | por instalar |
| Álbum, cromos, medallas, pósteres | `Album`, `Main`, `Recompensas*` | Cloud Firestore con caché sin conexión | instalado |
| Medallas que no se falsean, intercambios en que nadie pierde un cromo | `CatalogoLogros`, `Intercambio*` | Cloud Functions con transacciones | andamiaje (`functions/`) |
| Intercambio por enlace o QR | `IntercambioProponer`, `IntercambioRecibido` | `expo-linking` (esquema `plumario://`), `react-native-qrcode-svg`, escaneo con `expo-camera` | esquema configurado |
| Mapa de regiones del Perú | `RegionMapa` | `react-native-svg` | instalado |
| Cromos holográficos, plata, oro, diamante; revelado | `RevelarCromado`, `RevelarDiamante`, `Sticker*` | `@shopify/react-native-skia` + `react-native-reanimated` | Reanimated instalado; Skia, por instalar |
| Pósteres para compartir e imprimir (A3) | `PosterGenerar`, `PosterImpresion` | Skia para componer la imagen, `expo-sharing`, `expo-media-library`; la versión de imprenta, en una Function | por instalar |
| Errores en producción | — | Crashlytics (`@react-native-firebase/crashlytics`) | por instalar |

Las piezas «por instalar» entran con la tarjeta de su función: instalarlas antes solo suma código
nativo sin usar.

## Decisión

**App:** Expo SDK 58 (React Native 0.88, React 19.3, nueva arquitectura, React Compiler), expo-router
con rutas tipadas, TypeScript estricto. Builds de desarrollo (`expo-dev-client`), no Expo Go.

**Backend:** Firebase.
- **React Native Firebase** (SDK nativo), no el SDK web: Firestore guarda en el teléfono lo que se
  registra sin señal (humedales, desierto) y lo sube al volver la cobertura; las subidas de fotos
  se reanudan; trae Crashlytics.
- **Cloud Firestore** como base de datos: consultas por región, hábitat y especie, y reglas de
  seguridad por usuario.
- **Cloud Functions 2.ª generación en TypeScript** (`functions/`) para la IA, los intercambios y
  las medallas.

**Repositorio:** monorepo pnpm + turbo, con arquitectura hexagonal (ADR-0002).
- `apps/mobile`: la app.
- `packages/core`: dominio, puertos y casos de uso, sin dependencias de plataforma.
- `packages/ui`: componentes reutilizables del sistema de diseño.
- `packages/tokens`: la paleta F, la letra, el espacio y los cromos, generados desde
  `diseno/paletas/paletas.json` con prueba de contraste AA.
- `functions/`: Cloud Functions.
- pnpm con `nodeLinker: hoisted` (`node_modules` plano). La instalación aislada rompe la resolución
  de algunas librerías nativas; ya le pasó a `archetypes-mobile`.

**Builds y publicación:** EAS Build. iOS se compila en la nube porque en Windows no hay Xcode.

**Interfaz:** pestañas JS de expo-router (`expo-router/js-tabs`) con la barra propia del diseño
(`BarraNav`: flotante, con muesca y el botón Registrar en medio). Las pestañas nativas no admiten
esa forma.

## Alternativas descartadas

- **Supabase:** el usuario trabaja este proyecto con Firebase.
- **Firebase JS SDK en la app:** funciona en Expo Go y en web, pero en el móvil la caché sin
  conexión vive en memoria (lo pendiente se pierde si se cierra la app sin señal) y no hay
  Crashlytics.
- **Realtime Database:** las consultas son demasiado limitadas para filtrar el álbum.
- **Solo cliente, sin Functions:** la clave de la IA quedaría en la app, y las medallas y los
  intercambios se podrían falsear.
- **Pestañas nativas (`NativeTabs`):** no admiten la barra con muesca del diseño.

## Consecuencias

- La app se prueba en un build de desarrollo (`pnpm android`), no en Expo Go. La primera
  compilación es larga.
- Hace falta un proyecto de Firebase en la consola, con sus archivos `google-services.json` y
  `GoogleService-Info.plist`. Mientras no estén, la app compila sin los plugins nativos de
  Firebase (`app.config.ts`) y los emuladores corren con el proyecto `demo-plumario`.
- Cloud Functions exige el plan Blaze (pago por uso).
- La región de Functions (`southamerica-west1`, Santiago, la más cercana a Perú) tiene que
  coincidir con la ubicación de Firestore que se elija al crear el proyecto, y esa ubicación no se
  puede cambiar después.
- iOS: frameworks dinámicos (`expo-build-properties`), porque el SDK de Firebase para Apple 13+ solo
  se distribuye por SPM. Compilar iOS en local exigiría Xcode 26.2 en macOS 15.
