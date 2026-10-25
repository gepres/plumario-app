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
| `users/{uid}/sightings/{id}` | Registro: `speciesId`, `regionId`, `takenAt`, `status` (`pending` → `validated`/`rejected`), `photoPath`, `location?`, `createdAt` | el dueño lo crea *pendiente*; el servidor cambia el estado | el dueño |
| `users/{uid}/stickers/{speciesId}` | Sticker: `completedAt`, `validPhotos`, `chrome { source: luck/photos/trade, at }`, `category` | el servidor | el dueño |
| `users/{uid}/achievements/{id}` | Logro (`first-bird`, `explorer`, `milestone-10`, `habitat-coast`, `album-complete`): `kind`, `earnedAt`, `seen` | el servidor; el dueño solo marca `seen` | el dueño |
| `users/{uid}/posters/{id}` | Póster guardado: `kind` (species/habitat), `number`, `habitat`, `speciesIds`, `seed`, `theme`, `title`, `savedAt` | el dueño | el dueño |
| `trades/{tradeId}` | Propuesta de intercambio: `fromUid`, `offeredSpeciesId`, `requestedSpeciesId`, `status` (`open` → `accepted`/`cancelled`), `createdAt` | quien propone la crea y puede cancelarla; aceptarla, el servidor | cualquiera con sesión que tenga el enlace |

| Storage | Qué es | Escribe y lee |
|---|---|---|
| `users/{uid}/photos/{archivo}` | Fotos de los registros (imágenes, hasta 10 MB) | solo el dueño |

## Flujo de un registro

1. La app sube la foto a `users/{uid}/photos/` y crea `users/{uid}/sightings/{id}` con `status: pending`.
   Firestore guarda el registro en el teléfono aunque no haya señal y lo sube al volver la cobertura.
2. Una Cloud Function (`onDocumentCreated`) valida la foto con el identificador de especies (hoy uno de
   prueba; el proveedor de IA está por decidir) y, en una transacción, aplica
   `evaluateValidatedPhoto` del núcleo: completa el sticker o suma la foto, decide el cromo
   (1 de 8 al azar al completar, o 5 fotos validadas), y guarda los logros nuevos.
3. La app escucha sus stickers y logros, y celebra los que tienen `seen: false`.

## Privacidad

- Las fotos y su ubicación nunca salen de la cuenta del usuario: ni el intercambio ni la tarjeta para
  compartir las incluyen.
- En especies amenazadas (`threatened`), la ubicación no se muestra nunca, tampoco al compartir.
- La ubicación solo se guarda si el usuario lo activa (`privacy.saveLocation`), y solo sirve para
  asignar la región.
