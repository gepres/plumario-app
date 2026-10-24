# Diseño · Sistema de recompensas · Aves de Ica

Copia local del canvas de Claude Design
<https://claude.ai/code/artifact/b2c44b8d-f350-4ef2-9295-42cf3386f318>
(versión `1792827069-ebff`, bajada el 24 oct 2026).

| Carpeta | Qué hay |
|---|---|
| `project/canvas.json` | Índice del canvas: posición y título de cada artboard, secciones (`notes`) y páginas (`v2` «Sistema v2», `v1` «Versión 1»). |
| `project/*.dc.html` | Los 64 artboards. Cada uno es una pantalla o componente en formato Design Component. |
| `assets/<id>.svg` | Las imágenes subidas al canvas (aves, siluetas, mapa). En los artboards aparecen como `/_blob/<id>`. |
| `runtime/dc-runtime.js` | El intérprete del formato `.dc.html` (trae React empaquetado). En el canvas se sirve como `support.js`. |
| `reference/dc-format.md` | La sintaxis del formato: huecos `{{…}}`, `<sc-for>`, `<sc-if>`, `<dc-import>`, eventos y estado. |
| `palettes/palettes.json` | Los 12 temas de la página «Paletas» (A Pacífico, B Índigo colibrí, C Huacachina, D Totoral, E Vendimia, F Ribera; cada uno claro y oscuro), con los colores del logo. C, D y E los propuso Codex; F es la variante de D con fondo blanco en claro y carbón en oscuro. |
| `palettes/contrast.mjs` | Comprueba el contraste AA de cada tema (`node design/palettes/contrast.mjs`; la última salida está en `contrast.txt`). Hoy fallan 11 combinaciones de A y B, que no van a la app. |
| `palettes/current-themes.json` | Los temas A y B como estaban antes de sumar C a F, para comparar. |

Los artboards `Paleta*.dc.html` se generan desde `palettes.json` con
`node tools/palettes/generate.mjs <carpeta>`, sobre una copia recién leída del canvas
(`<carpeta>/project/`). También pone los 12 temas en las pantallas `Tema*` y añade lo nuevo a
`canvas.json`. El logo con los colores de cada tema es `TemaLogo.dc.html`.

Componentes que importan otras pantallas con `<dc-import>`: `BarraNav`, `Boton`, `Campo`,
`Medalla`, `Sticker`, `StickerAve`, `Poster10`, `PosterHabitat`, `PosterLitoral`, `TarjetaLogro`.

La guía visual (color, letra, espacio, íconos y componentes) está en `GuiaFundamentos.dc.html`
y `GuiaComponentes.dc.html`.

Los nombres de los artboards y las claves de `palettes.json` y `canvas.json` son los del canvas:
no se traducen, para poder volver a bajarlo y compararlo. La app los usa en inglés a través de
`@plumario/tokens` (`designKeyMap`).

## Verlo

`../viewer/index.html` se abre con doble clic (no hace falta servidor). Tiene dos vistas:
**Galería** (todas las miniaturas por sección) e **Índice** (la lista numerada a la izquierda y
la pantalla elegida al centro). Desde la raíz del proyecto:

```
pnpm viewer         # regenera viewer/index.html desde design/
pnpm viewer:serve   # opcional: lo sirve en http://localhost:4321/
```

Los archivos `project/*.dc.html` no se ven bien abiertos sueltos: necesitan el runtime y las
imágenes, que el visor les pone.
