# Plumario

Álbum de aves de Ica: registras un ave con una foto, la IA sugiere la especie, la pegas en el
álbum y ganas cromos, medallas y pósteres por hábitat.

## Estado

Esqueleto listo para empezar a desarrollar:

- App Expo (SDK 58) con la paleta **F · Ribera** en claro y oscuro, las fuentes y la barra de
  navegación del diseño, y las pantallas principales como pendientes.
- **Arquitectura hexagonal:** `@plumario/core` (dominio, puertos y casos de uso) sin dependencias
  de plataforma; la app solo compone. El hero de Inicio ya recorre todas las capas con datos en
  memoria.
- **Componentes reutilizables** en `@plumario/ui`, sobre `@plumario/tokens`, generados desde el
  diseño con prueba de contraste AA.
- Firebase: React Native Firebase en la app, Cloud Functions en TypeScript y emuladores locales
  con el proyecto `demo-plumario`. El proyecto real en la consola aún no existe.

## Requisitos

Node 24, pnpm 10.12.4, JDK 17, Android Studio (su Java sirve a los emuladores de Firebase) con un
emulador, y una cuenta de Expo para EAS. Versiones y pasos: [`docs/environment.md`](docs/environment.md).

## Arrancar

```bash
pnpm install
pnpm android        # build de desarrollo en el emulador (la primera vez tarda)
pnpm dev            # luego, solo el servidor de desarrollo
pnpm web            # vista rápida en el navegador, sin Firebase
pnpm check          # lint, tipos, pruebas y reglas de arquitectura
pnpm emulators      # Firebase local: Auth, Firestore, Storage y Functions
```

## Estructura

```text
apps/mobile/        App Expo con expo-router (adaptadores y raíz de composición)
packages/core/      Dominio, puertos y casos de uso
packages/ui/        Componentes reutilizables
packages/tokens/    Paleta, letra, espacio y cromos (generados desde diseno/)
functions/          Cloud Functions
firebase/           Reglas e índices de Firestore y Storage
scripts/            Reglas de arquitectura y emuladores
diseno/             Los artboards del diseño (Claude Design) y las paletas
visor/              Visor del diseño: abre visor/index.html con doble clic
herramientas/       Scripts del visor y de las paletas
docs/               ADR y guía del entorno
```

## Documentación

- [`docs/architecture/adr-0001-stack.md`](docs/architecture/adr-0001-stack.md): qué se eligió y por qué.
- [`docs/architecture/adr-0002-hexagonal-architecture.md`](docs/architecture/adr-0002-hexagonal-architecture.md): capas, reglas y el primer corte vertical.
- [`docs/environment.md`](docs/environment.md): herramientas, Firebase, emuladores, EAS y problemas conocidos.
- [`diseno/README.md`](diseno/README.md): de dónde sale el diseño y cómo se regenera.
- [`CLAUDE.md`](CLAUDE.md): instrucciones para agentes.
