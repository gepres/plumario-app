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
| `referencia/formato-dc.md` | La sintaxis del formato: huecos `{{…}}`, `<sc-for>`, `<sc-if>`, `<dc-import>`, eventos y estado. |
| `paletas/paletas.json` | Los 12 temas de la página «Paletas» (A Pacífico, B Índigo colibrí, C Huacachina, D Totoral, E Vendimia, F Ribera; cada uno claro y oscuro), con los colores del logo. C, D y E los propuso Codex; F es la variante de D con fondo blanco en claro y carbón en oscuro. |
| `paletas/contraste.mjs` | Comprueba el contraste AA de cada tema (`node diseno/paletas/contraste.mjs`). Hoy fallan 11 combinaciones de A y B. |

Los artboards `Paleta*.dc.html` se generan desde `paletas.json` con
`node herramientas/paletas/generar.mjs <carpeta>`, sobre una copia recién leída del canvas
(`<carpeta>/project/`). También pone los 12 temas en las pantallas `Tema*` y añade lo nuevo a
`canvas.json`. El logo con los colores de cada tema es `TemaLogo.dc.html`.

Componentes que importan otras pantallas con `<dc-import>`: `BarraNav`, `Boton`, `Campo`,
`Medalla`, `Sticker`, `StickerAve`, `Poster10`, `PosterHabitat`, `PosterLitoral`, `TarjetaLogro`.

La guía visual (color, letra, espacio, íconos y componentes) está en `GuiaFundamentos.dc.html`
y `GuiaComponentes.dc.html`.

## Verlo

`../visor/index.html` se abre con doble clic (no hace falta servidor). Tiene dos vistas:
**Galería** (todas las miniaturas por sección) e **Índice** (la lista numerada a la izquierda y
la pantalla elegida al centro). Desde la raíz del proyecto:

```
node herramientas/visor/construir.mjs   # regenera visor/index.html desde diseno/
node herramientas/visor/servir.mjs      # opcional: lo sirve en http://localhost:4321/
```

Los archivos `project/*.dc.html` no se ven bien abiertos sueltos: necesitan el runtime y las
imágenes, que el visor les pone.
