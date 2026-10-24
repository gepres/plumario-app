# ADR-0002 · Arquitectura hexagonal y componentes reutilizables

- **Estado:** aceptado. El usuario lo pidió el 24 oct 2026: «que tenga componentes reutilizables,
  y arquitectura hexagonal».
- **Relacionado:** ADR-0001 (stack).

## Contexto

La lógica de Plumario (cuándo se arma un póster, qué medalla toca, si un intercambio es válido,
qué ubicación se puede mostrar) tiene que valer igual en la app y en Cloud Functions, y no puede
quedar atada a Firebase ni a React. El diseño, además, define componentes que se repiten en todas
las pantallas (botón, tarjeta, progreso, fila de lista, barra de pestañas…).

## Decisión

Puertos y adaptadores, con el núcleo en un paquete propio y la UI en otro:

```text
                     ┌──────────────────────────────────────────┐
  adaptadores de     │ @plumario/core                           │     adaptadores de
  entrada            │                                          │     salida
                     │  application/use-cases  ──usa──▶ ports   │
  apps/mobile ──────▶│        │                        (interfaces)◀──── in-memory (hoy)
  (rutas, pantallas, │        ▼                                 │◀──── Firestore, Storage,
   hooks)            │  domain (reglas puras)                   │      Auth (después)
                     │                                          │
  functions/ ───────▶│                                          │◀──── firebase-admin
  (HTTP, callables)  └──────────────────────────────────────────┘

  @plumario/ui   componentes de presentación  ──usa──▶  @plumario/tokens
```

| Capa | Dónde | Puede depender de | No puede depender de |
|---|---|---|---|
| Dominio | `packages/core/src/domain` | nada | ningún paquete |
| Puertos y casos de uso | `packages/core/src/application` | el dominio | ningún paquete |
| Componentes | `packages/ui/src` | React, React Native, SVG, `@plumario/tokens`, fuentes | el núcleo, expo-router, Firebase |
| Tokens | `packages/tokens/src` | nada | ningún paquete |
| Adaptadores de entrada | `apps/mobile/src/app`, `screens`, `hooks`, `components` | el núcleo, la UI, `useDependencies` | los adaptadores de salida, Firebase |
| Adaptadores de salida | `apps/mobile/src/infrastructure` | el núcleo (implementan sus puertos), Firebase | las pantallas |
| Raíz de composición | `apps/mobile/src/infrastructure/dependencies.tsx` | todo lo anterior | — |
| Functions | `functions/src` | el núcleo, firebase-functions, firebase-admin | React, la UI |

- **El núcleo no conoce plataformas.** Un caso de uso recibe sus puertos por parámetro
  (`makeGetAlbumSummary({ catalog, sightings })`) y se prueba con dobles en memoria.
- **La raíz de composición es el único lugar que elige adaptadores.** Las pantallas piden los casos
  de uso con `useDependencies()`; nunca importan un adaptador. Cambiar memoria por Firestore es
  tocar ese archivo.
- **Los componentes de `@plumario/ui` no saben de rutas ni de dominio.** La `TabBar` recibe las
  pestañas ya resueltas; `navigation-tab-bar.tsx` la conecta con expo-router. Los textos visibles
  llegan por props.
- **Las reglas se verifican, no se confían.** `scripts/check-architecture.mjs` lee los imports y
  falla si una capa importa lo que no debe; corre al final de `pnpm check`. Con pnpm en modo
  hoisted cualquier paquete resuelve cualquier dependencia, así que sin este chequeo el núcleo
  podría importar Firebase y compilaría igual.

### El primer corte vertical

El hero de Inicio recorre todas las capas: `summarizeAlbum` y `nextPoster` (dominio, con la regla
del diseño «cada 10 especies se arma un póster») → `makeGetAlbumSummary` (caso de uso) →
`SpeciesCatalog` y `SightingRepository` (puertos) → `sampleSpeciesCatalog` e
`InMemorySightingRepository` (adaptadores en memoria) → `dependencies.tsx` → `useAlbumSummary` →
`Home`.

## Consecuencias

- Una función nueva empieza por el núcleo (regla de dominio + caso de uso + puerto, con pruebas)
  y termina en un adaptador y una pantalla.
- Los adaptadores de Firestore llegan con la tarjeta del modelo de datos; hasta entonces la app
  corre con datos en memoria y el catálogo es una muestra de las especies del diseño.
- Cuando Functions use el núcleo, habrá que empaquetarlo (esbuild) al compilar: el despliegue
  instala dependencias con npm en la nube y no resuelve paquetes `workspace:*`.
- Convención de nombres: archivos e identificadores en inglés; comentarios, documentación y textos
  de la interfaz en español.
