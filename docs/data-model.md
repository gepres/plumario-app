# Modelo de datos

Firestore (base `(default)` en `nam5`) y Cloud Storage. Las reglas están en `firebase/` y se prueban
contra los emuladores con `pnpm test:rules`. Las reglas del juego (cromos, logros, pósteres,
intercambios) son funciones puras de `@plumario/core`; aquí solo se guardan sus resultados.

**Regla general:** cada usuario lee lo suyo. Lo que se gana (stickers, cromos, logros) y el resultado
de un intercambio lo escribe el servidor (Cloud Functions con el Admin SDK). El cliente crea
registros pendientes, pósteres y propuestas de intercambio, y edita su perfil.

## Colecciones

| Ruta | Qué es | Escribe | Lee |
|---|---|---|---|
| `regions/{regionId}` | La región-álbum: `name`, `albumClass`, `speciesCount`, `albumCount` | `tools/species/seed.mjs` | todos, sin sesión |
| `regions/{regionId}/species/{speciesId}` | Catálogo (ver `data/README.md`) | `tools/species/seed.mjs` | todos, sin sesión |
| `users/{uid}` | Perfil: `displayName`, `handle`, `regionId`, `privacy { saveLocation, albumVisibility }`, `createdAt` | el dueño (el `handle` no cambia) | el dueño |
| `handles/{handle}` | Reserva del @usuario, que es único: `uid`, `createdAt`. Se crea en la misma escritura que el perfil y las reglas exigen que sea de quien lo crea | el dueño, una vez; nadie la cambia ni la borra | cualquiera, de a uno (para ver si está libre); no se listan |
| `users/{uid}/sightings/{id}` | Registro: `speciesId`, `regionId`, `takenAt`, `status` (`pending` → `validated`/`rejected`), `photoPath`, `location?`, `placeName?` («Lugar», hasta 60), `createdAt`; al validarlo, el servidor suma `result` (qué pasó: sticker completado, cromo, logros, avance) y `validatedAt`. En una especie amenazada, `location` y `placeName` van siempre en `null` (lo exigen las reglas) | el dueño lo crea *pendiente*; el servidor cambia el estado y escribe el resultado | el dueño |
| `users/{uid}/stickers/{speciesId}` | Sticker: `completedAt`, `validPhotos`, `chrome { source: luck/photos/trade, at }`, `category` | el servidor | el dueño |
| `users/{uid}/achievements/{id}` | Logro (`first-bird`, `explorer`, `milestone-10`, `habitat-coast`, `album-complete`): `kind`, `earnedAt`, `seen` | el servidor; el dueño solo marca `seen` | el dueño |
| `users/{uid}/posters/{id}` | Póster guardado: `kind` (species/habitat), `number`, `habitat`, `speciesIds`, `seed`, `theme`, `title`, `savedAt` | el dueño | el dueño |
| `trades/{tradeId}` | Propuesta de intercambio: `fromUid`, `fromHandle` (su @usuario, que las reglas comparan con su perfil), `offeredSpeciesId`, `requestedSpeciesId`, `status` (`open` → `accepted`/`cancelled`), `createdAt`; al aceptarla, el servidor suma `acceptedBy` y `acceptedAt` | quien propone la crea y puede cancelarla; aceptarla, el servidor | cualquiera con sesión que tenga el enlace (de a una); solo se listan las propias |
| `trades/{tradeId}/acceptances/{id}` | Pedido de aceptar: `uid`, `createdAt`; el servidor responde con `result` (`accepted` o `rejected` y el motivo) y `answeredAt` | quien acepta lo crea, mientras la propuesta siga abierta y no sea la propia; el servidor responde | quien lo creó |

| Storage | Qué es | Escribe y lee |
|---|---|---|
| `users/{uid}/photos/{archivo}` | Fotos de los registros (imágenes, hasta 10 MB) | solo el dueño |

## Flujo de un registro

1. La app achica la foto (lado mayor de 1600 px, JPEG), la sube a `users/{uid}/photos/{id}.jpg` y crea
   `users/{uid}/sightings/{id}` con `status: pending` (`makeRegisterSighting`).
2. La Cloud Function `onSightingCreated` (`functions/src/sightings.ts`) valida la foto con el
   identificador de especies (hoy uno de prueba; el proveedor de IA está por decidir) y, en una
   transacción, aplica `evaluateValidatedPhoto` del núcleo: completa el sticker o suma la foto,
   decide el cromo (1 de 8 al azar al completar, o 5 fotos validadas) y guarda los logros nuevos. Si
   el registro ya no está pendiente (un reintento de la función), no otorga nada dos veces.
3. Deja el resultado en el registro (`status` y `result`). La app lo escucha y muestra
   RegistrarCompletado, RevelarCromado o RevelarDiamante, o que la foto no se reconoció.

Las Cloud Functions se empaquetan con esbuild en `functions/dist` (con el núcleo adentro) y Firebase
despliega esa carpeta, que trae su propio `package.json` solo con las dependencias de ejecución.

## Flujo de un intercambio

1. Quien propone elige qué da y qué pide (IntercambioProponer): un cromo propio por el de una especie
   que ya registró, de igual o menor categoría (`makeProposeTrade` revisa su lado). Crea
   `trades/{id}` y lo comparte por enlace (`plumario://trade/{id}`) o QR.
2. Quien abre el enlace ve la propuesta con su álbum (`receivedTrade`): si tiene el cromo pedido y el
   sticker normal del ofrecido, puede aceptar. Los stickers del otro no se leen.
3. Al aceptar crea `trades/{id}/acceptances/{id}`. La Cloud Function `onTradeAcceptanceCreated`
   (`functions/src/trades.ts`) relee la propuesta y los stickers de los dos en una transacción, aplica
   `tradeProblem` y `applyTrade` del núcleo (cada uno recibe el cromo del otro, con `source: trade`, y
   el suyo vuelve a normal), cierra la propuesta y responde en la aceptación. La app espera esa respuesta.

No se comparten fotos ni ubicación: la propuesta solo lleva especies y el @usuario.

## Pósteres

- **Cada 10 especies:** al llegar a 10, 20, 30… se habilita un póster. La app elige las 10 especies con
  `posterSpecies` (el 1, las 10 primeras; desde el 2, al azar con al menos una por hábitat) a partir de
  una semilla: «Mezclar» solo cambia la semilla. Al guardarlo quedan fijos `speciesIds`, `seed`,
  `theme` y `title` (`makeSavePoster`), así se dibuja igual siempre.
- **Por hábitat:** siempre se ve, con las especies que faltan en sombra; no se guarda. Se descarga al
  completar el hábitat. «Usar mis fotos» pone la foto validada más reciente de cada especie
  (`makeListCoverPhotos`).
- **Exportar** (en el teléfono, sin servidor): el póster se dibuja fuera de la pantalla a 3508 px de
  ancho y se captura. PNG de 3508 × 4961 px (A3 a 300 ppp) para las fotos o para compartir, y PDF A3
  con 3 mm de sangrado y marcas de corte (`apps/mobile/src/utils/export-poster.ts`).

## Privacidad

- Las fotos y su ubicación nunca salen de la cuenta del usuario: ni el intercambio ni la tarjeta para
  compartir las incluyen.
- En especies amenazadas (`threatened`), la ubicación no se muestra nunca, tampoco al compartir.
- La ubicación solo se guarda si el usuario lo activa (`privacy.saveLocation`), y solo sirve para
  asignar la región.
