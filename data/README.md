# Datos

## Catálogo de especies de Ica

| Archivo | Qué es |
|---|---|
| `sources/species-ica.xlsx` | La fuente: 334 especies con presencia documentada en Ica (294 aves, 29 mamíferos, 11 reptiles). **No se versiona**: trae fotos de terceros. |
| `species/ica.json` | El catálogo que se carga a Firestore, generado desde el Excel. Claves en inglés. |
| `species/ica-habitats.xlsx` | El hábitat del álbum de cada especie, para revisar a mano en Excel: trae filtros y listas desplegables. |
| `species/proposals/` | Las dos propuestas independientes de hábitat (Claude y Codex) de las que sale la tabla. |
| `sources/avonet-dataset-1.xlsx` | AVONET (Tobias et al. 2022, Ecology Letters, CC BY 4.0), [de Figshare](https://doi.org/10.6084/m9.figshare.16586228.v7). **No se versiona**: pesa 21 MB. |
| `species/ica-measures.json` | Peso, ala y pico de las aves del álbum, sacados de AVONET. Las 294 tienen datos: 3 aves separadas hace poco (`splitFrom`) copian los de la especie de origen, como pidió el biólogo. |
| `species/ica-special-measures.json` | Lo que corrige o completa AVONET en la carta: la envergadura del cóndor y de los albatros, con su fuente. |
| `species/ica-families.json` | Nombre, dieta y rasgos de la carta para cada una de las 55 familias. Aprobados por el biólogo. |

### Pasos

```bash
pnpm species:convert     # Excel + tabla de hábitats → species/ica.json
pnpm species:seed        # carga ica.json al emulador (con pnpm emulators corriendo)
pnpm species:seed --prod # carga al proyecto real: exige los hábitats del álbum revisados
pnpm species:measures    # AVONET → species/ica-measures.json
pnpm species:cards       # familias + medidas → apps/mobile/src/constants/card-facts.ts
```

Los datos de la carta van dentro del paquete de la app, no en Firestore: cambiarlos no toca producción.
Los sellos, en cambio, salen del catálogo: si cambian, hay que correr `pnpm species:seed --prod`.
El biólogo aprobó los textos y las medidas: por eso `ica-families.json` y `ica-measures.json` llevan
`reviewed: true`. Si AVONET vuelve a generarse, `species:measures` reinicia esa marca.

### Revisar los hábitats

El Excel no dice en qué hábitat del álbum va cada especie, así que lo propusieron dos IAs por
separado. Coincidieron en 300 de 334; la columna **`revisar`** marca con «sí» las 71 filas donde
discreparon o alguna dudó.

1. Abre `species/ica-habitats.xlsx` y, con las flechas del encabezado, filtra `revisar = sí` y
   `clase = Ave` (61 filas; los mamíferos y reptiles no van en el álbum).
2. Corrige `habitat` donde haga falta, con su lista desplegable (Litoral, Humedales, Desierto,
   Sierra, Mar abierto). Las columnas `propuesta_codex` y `motivo_codex` muestran la otra opinión.
3. Pon **`revisado = sí`** en las filas que apruebes. La carga a producción exige las 294 aves
   revisadas: para aprobar las que no tenían dudas, filtra `clase = Ave` y `revisado = no`,
   selecciona esas celdas de `revisado`, escribe `sí` y pulsa Ctrl+Enter.
4. Guarda con Ctrl+S (se queda en .xlsx).
5. `pnpm species:convert` y, cuando todo el álbum esté revisado, `pnpm species:seed --prod`.

Las columnas verdes (`habitat` y `revisado`) son las que se editan; el resto es contexto. La tabla
la arma `node tools/species/merge-habitat-proposals.mjs` desde las propuestas, y no pisa una tabla
que ya tenga filas revisadas. Si el Excel cambia (una especie nueva), vuelve a correr
`pnpm species:convert`: el conteo «con hábitat» de su salida muestra si falta alguna en la tabla;
agrégala como fila nueva.

### Reglas que salen de aquí

- El álbum es de **aves**: solo ellas llevan número de álbum y cuentan para pósteres y medallas.
- **Amenazada** = categoría CR, EN o VU en la lista nacional o en la IUCN (51 especies). Su ubicación
  se oculta siempre (PerfilPrivacidad).
- **La lista nacional es el Decreto Supremo 004-2014-MINAGRI**, y el Libro Rojo de la fauna del Perú
  trae las mismas especies. Las 35 aves del álbum con categoría nacional se contrastaron con el Anexo
  del decreto el 1 nov 2026: coinciden todas, y ninguna otra ave del álbum aparece en él.
- **Las endémicas se validan con la lista de Plenge y Angulo** (UNOP). Contra la versión del 23 de
  marzo de 2026, los 294 nombres científicos coinciden y las 7 endémicas salen `E`. El Churrete
  Marisquero también sale `E`, pero el biólogo lo sacó: está por confirmar con él (PA-37).
- Las fotos del Excel no van en la app; cada especie usa la silueta del diseño hasta que el usuario la
  fotografía.
