# Modelo de datos

Firestore (base `(default)` en `southamerica-west1`) y Cloud Storage. Las reglas están en `firebase/` y se prueban
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
| `users/{uid}` | Perfil: `displayName`, `handle`, `regionId`, `favoriteSpeciesId` (la foto de perfil), `privacy { saveLocation, albumVisibility: private/link/public (la app aún no lo ofrece: el álbum solo lo ve su dueño), showName, improveAi }`, `handleChangedAt`, `regionAlerts` (las regiones que espera, «Avísame cuando esté»), `notifications { achievements, trades, regions }` (los avisos que quiere; lo que falta cuenta como encendido), `createdAt` | el dueño; el `handle` cambia una vez cada 30 días, reservando el nuevo y liberando el anterior en la misma escritura | el dueño |
| `handles/{handle}` | Reserva del @usuario, que es único: `uid`, `createdAt`. Se crea en la misma escritura que el perfil y las reglas exigen que sea de quien lo crea | el dueño; la borra solo al cambiar de @usuario, en la misma escritura en que su perfil deja de usarla | cualquiera, de a uno (para ver si está libre); no se listan |
| `feedback/{id}` | Comentario (PerfilComentario): `userId`, `kind` (idea/error/bird/other), `text` (hasta 500), `replyTo` (el correo, solo si deja responder), `screenshotPath`, `appVersion`, `platform`, `createdAt` | quien tiene sesión, a su nombre | nadie desde la app (el equipo, en la consola) |
| `users/{uid}/sightings/{id}` | Registro: `speciesId`, `regionId`, `takenAt`, `status` (`pending` → `validated`/`rejected`), `photoPath`, `location?`, `placeName?` («Lugar», hasta 60), `createdAt`; al validarlo, el servidor suma `result` (qué pasó: sticker completado, si contó y por qué no, acabado ganado, logros, avance), `validatedAt` y `reviewPending` (la IA no pudo revisarla: la foto entra a la galería y la recompensa espera). En una especie amenazada, `location` y `placeName` van siempre en `null` (lo exigen las reglas) | el dueño lo crea *pendiente* y no puede editarlo ni borrarlo; el servidor cambia el estado y escribe el resultado | el dueño |
| `users/{uid}/photoClaims/{sha256}` | Huella de una foto que ya contó: `sightingId`, `claimedAt`. El id es el SHA-256 del archivo, así el mismo archivo no cuenta dos veces aunque se suba de nuevo o varios registros apunten a él | el servidor | nadie desde la app |
| `users/{uid}/stickers/{speciesId}` | Sticker: `completedAt`, `validPhotos` (solo para la galería), `observations`, `lastCountedAt`, `serverDay` y `serverCount` (el tope por día de servidor), `best`, `ownBest` (lo ganado sin intercambio), `claimedMilestone` (nunca baja), `unlocked [{ finish, source: luck/milestone/pack/purchase/trade, at }]` | el servidor | el dueño |
| `users/{uid}/achievements/{id}` | Logro (`first-bird`, `explorer`, `milestone-10`, `habitat-coast`, `album-complete`): `kind`, `earnedAt`, `seen` | el servidor; el dueño solo marca `seen` | el dueño |
| `users/{uid}/posters/{id}` | Póster guardado: `kind` (species/habitat), `number`, `habitat`, `speciesIds`, `seed`, `theme`, `title`, `savedAt` | el dueño | el dueño |
| `users/{uid}/devices/{token}` | Teléfono que recibe los avisos push (el id es su token de FCM): `platform` (android/ios), `updatedAt` | el dueño lo registra al activar las notificaciones y lo borra al cerrar sesión; el servidor borra los que FCM ya no acepta | el dueño |
| `users/{uid}/usage/{AAAA-MM-DD}` | Uso de la IA en el día: `aiCalls` (sugerir y revisar antes de guardar, tope de 60, `AI_DAILY_LIMIT`), `validations` (revisiones de registros guardados, tope de 60, `VALIDATION_DAILY_LIMIT`), `updatedAt` | el servidor | nadie desde la app |
| `trades/{tradeId}` | Propuesta de intercambio: `fromUid`, `fromHandle` (su @usuario, que las reglas comparan con su perfil), `offeredSpeciesId`, `requestedSpeciesId`, `status` (`open` → `accepted`/`cancelled`), `createdAt`; al aceptarla, el servidor suma `acceptedBy` y `acceptedAt` | quien propone la crea y puede cancelarla; aceptarla, el servidor | cualquiera con sesión que tenga el enlace (de a una); solo se listan las propias |
| `trades/{tradeId}/acceptances/{id}` | Pedido de aceptar: `uid`, `createdAt`; el servidor responde con `result` (`accepted` o `rejected` y el motivo) y `answeredAt` | quien acepta lo crea, mientras la propuesta siga abierta y no sea la propia; el servidor responde | quien lo creó |

| Storage | Qué es | Escribe y lee |
|---|---|---|
| `users/{uid}/photos/{archivo}` | Fotos de los registros (imágenes, hasta 10 MB) | solo el dueño |

## Flujo de un registro

1. Antes de guardar, la IA ayuda a elegir: la app manda la foto (lado mayor de 1024 px) a las
   funciones invocables `suggestSpecies` (RegistrarIdentificar: hasta 3 especies del álbum de la
   región) y `checkPhoto` (RegistrarColocar: «La IA confirma»). Corren con Gemini
   (`functions/src/ai.ts`); la clave es un secreto de Functions y nunca llega a la app. Piden sesión
   y cuentan en `users/{uid}/usage`. Si la IA no responde, se puede elegir la especie a mano.
2. La app achica la foto (lado mayor de 1600 px, JPEG), la sube a `users/{uid}/photos/{id}.jpg` y crea
   `users/{uid}/sightings/{id}` con `status: pending` (`makeRegisterSighting`).
3. La Cloud Function `onSightingCreated` (`functions/src/sightings.ts`) lee la foto de Storage y, antes
   de gastar IA, rechaza el registro si ese archivo ya contó (`photoClaims`) o si se llegó al tope
   diario. Después vuelve a revisar la foto con Gemini (la app no es de fiar; si Gemini no responde, el
   registro se da por bueno) y, en una transacción, guarda la huella y aplica `evaluateValidatedPhoto`
   del núcleo: completa el sticker o suma la foto a la galería, decide si la observación cuenta (1 por
   especie y día de Lima, 1 por semana en amenazadas, 3 por especie y día de servidor), sortea el cromo
   de la primera observación (1 de 8), cobra los hitos (`docs/card-progression.md`) y guarda los logros
   nuevos. Si el registro ya no está pendiente (un reintento de la función), no otorga nada dos veces;
   si dos registros traen la misma foto a la vez, cuenta uno.
4. Deja el resultado en el registro (`status` y `result`). La app lo escucha y muestra
   RegistrarCompletado, RevelarCromado o RevelarDiamante, o que la foto no se reconoció.
5. **Si Gemini no respondió**, la foto entró sin contar: `reviewPending: true` y `blocked: review`.
   `revalidateSightings` (`functions/src/revalidate.ts`, cada 30 min y de a 20, en São Paulo porque Cloud Scheduler no existe en Santiago) las busca con
   `collectionGroup` y las vuelve a revisar: la aprobada cuenta en ese momento y la rechazada pasa a
   `rejected` y resta 1 de `validPhotos`. Por eso `firestore.indexes.json` declara el campo
   `reviewPending` también a nivel de grupo.

**Sin señal:** si la foto no se puede subir (Storage reintenta 12 s y el adaptador lo traduce a
`NetworkError`), el registro queda en una cola del teléfono con una copia de la foto
(`documents/pending/`, puerto `SightingQueue`). `SightingQueueSync` la sube al abrir la app, al volver
a ella y cada 30 s mientras quede algo (`makeSendQueuedSightings`), y sigue cada registro hasta que el
servidor lo valida para releer el álbum. Mientras, la foto se ve en la galería como «En espera».

Las Cloud Functions se empaquetan con esbuild en `functions/dist` (con el núcleo adentro) y Firebase
despliega esa carpeta, que trae su propio `package.json` solo con las dependencias de ejecución.

## Flujo de un intercambio

**En pausa desde la fase 1** (`TRADES_PAUSED`): `tradeProblem` responde `paused`, el servidor rechaza
toda aceptación y las rutas muestran `TradePaused`. Vuelve en la fase 2B con las reglas de
`docs/card-progression.md`. Lo que sigue describe el flujo guardado en el código, que todavía cambia el
cromo del álbum y por eso no puede usarse.

1. Quien propone elige qué da y qué pide (IntercambioProponer): un cromo propio por el de una especie
   que ya registró, de igual o menor acabado (`makeProposeTrade` revisa su lado). Crea
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

## Cuenta y privacidad

- Las fotos y su ubicación nunca salen de la cuenta del usuario: ni el intercambio ni la tarjeta para
  compartir las incluyen.
- **Ubicación:** la app la toma del EXIF de la foto (`exifLocation`) y solo la guarda si «Guardar la
  ubicación» está encendido; en especies amenazadas, nunca (`makeRegisterSighting` y las reglas).
- **Correo:** se cambia confirmando con la contraseña; Firebase manda un enlace al correo nuevo y el
  cambio se hace al abrirlo.
- **Descargar tus datos:** un JSON con perfil, registros (con enlace a cada foto), stickers, logros y
  pósteres (`makeExportUserData`), que se comparte con la hoja del sistema.
- **Eliminar la cuenta:** la app la borra de Auth confirmando con la contraseña y la Cloud Function
  `onUserDeleted` (`functions/src/accounts.ts`) borra el perfil y todo lo que cuelga de él, sus fotos
  y su @usuario, y cancela sus propuestas abiertas.

## Avisos push

`functions/src/notify.ts` manda un aviso a los teléfonos de `users/{uid}/devices` si la persona lo
quiere (`users/{uid}.notifications`). Lo mandan tres Functions:

| Aviso | Cuándo | Abre |
|---|---|---|
| Medalla nueva | `onSightingCreated` otorga logros. Con la app abierta no se muestra: ya se celebra en pantalla | `/rewards` |
| Aceptaron tu intercambio | `onTradeAcceptanceCreated` acepta una propuesta: le avisa a quien la hizo | `/profile/trades` |
| Abrió una región | `onRegionCreated`: se crea `regions/{id}` (al cargar su catálogo) y se avisa a quienes la tienen en `regionAlerts` | `/regions` |

Un aviso que no sale no rompe la Function que lo pidió: se registra en el log y sigue.
