# Datos

## Catálogo de especies de Ica

| Archivo | Qué es |
|---|---|
| `sources/species-ica.xlsx` | La fuente: 334 especies con presencia documentada en Ica (294 aves, 29 mamíferos, 11 reptiles). **No se versiona**: trae fotos de terceros. |
| `species/ica.json` | El catálogo que se carga a Firestore, generado desde el Excel. Claves en inglés. |
| `species/ica-habitats.csv` | El hábitat del álbum de cada especie, para revisar a mano (se abre con Excel). |
| `species/proposals/` | Las dos propuestas independientes de hábitat (Claude y Codex) de las que sale la tabla. |

### Pasos

```bash
pnpm species:convert     # Excel + tabla de hábitats → species/ica.json
pnpm species:seed        # carga ica.json al emulador (con pnpm emulators corriendo)
pnpm species:seed --prod # carga al proyecto real: exige los hábitats del álbum revisados
```

### Revisar los hábitats

El Excel no dice en qué hábitat del álbum va cada especie, así que lo propusieron dos IAs por
separado. Coincidieron en 300 de 334; la columna **`revisar`** marca con «sí» las 71 filas donde
discreparon o alguna dudó.

1. Abre `species/ica-habitats.csv` con Excel y filtra `revisar = sí`.
2. Corrige `habitat` donde haga falta. Valores válidos: Litoral, Humedales, Desierto, Sierra,
   Mar abierto. Las columnas `propuesta_codex` y `motivo_codex` muestran la otra opinión.
3. Pon **`revisado = sí`** en las filas que apruebes (puedes aprobar todas de una vez).
4. Guarda como CSV (Excel en español lo guarda separado por «;», y se lee bien).
5. `pnpm species:convert` y, cuando todo el álbum esté revisado, `pnpm species:seed --prod`.

Si el Excel cambia (una especie nueva), vuelve a correr `pnpm species:convert`: el conteo «con
hábitat» de su salida muestra si falta alguna en la tabla; agrégala como fila nueva.

### Reglas que salen de aquí

- El álbum es de **aves**: solo ellas llevan número de álbum y cuentan para pósteres y medallas.
- **Amenazada** = categoría CR, EN o VU en la lista nacional o en la IUCN (51 especies). Su ubicación
  se oculta siempre (PerfilPrivacidad).
- Las fotos del Excel no van en la app; cada especie usa la silueta del diseño hasta que el usuario la
  fotografía.
