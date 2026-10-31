# Progresión de cromos

Las reglas de cromos, sobres, repetidas y plumas, aprobadas el 30 de octubre de 2026. Sustituyen a las
reglas anteriores, en las que el acabado dependía de la especie.

**Estado del código:** el dominio sigue con las reglas anteriores hasta la fase 1
(`packages/core/src/domain/card.ts`, `sticker.ts`, `trade.ts`). Los artboards de `design/project/` ya
describen estas reglas. Si el código y este documento no coinciden, manda este documento.

## El ciclo

```text
Observación válida
 ├─ avanza el hito de esa especie (seguro: 3, 5, 10, 20, 35)
 ├─ da 1 pluma
 └─ cada 3 observaciones: 1 sobre con una pieza de una de esas 3 aves
      ├─ supera tu acabado: se pega en el álbum
      └─ no lo supera: repetida, la cambias o la reciclas por plumas

Plumas: comprar el siguiente acabado o pagar una pieza para un intercambio
```

Los hitos son seguros y la suerte viene en los sobres. El acabado se gana: que un ave sea amenazada,
endémica o emblemática sigue siendo un dato de la especie, que se muestra como sello y nunca decide
el acabado.

## Acabados

De menor a mayor: holográfico, plata, oro, rubí y diamante. El álbum muestra el mejor acabado de cada
especie y nunca retrocede.

| Vía | Qué da |
|---|---|
| Primera foto | Holográfico, con probabilidad de 1/8 |
| Hitos, en observaciones de esa especie | 3 holográfico, 5 plata, 10 oro, 20 rubí y 35 diamante |
| Sobre | Una pieza al azar de la tabla de sobres |
| Compra | El acabado siguiente al que ya tienes |
| Intercambio | La pieza que entrega la otra persona |

Saltarse niveles no crea piezas de los niveles omitidos. Las colecciones piden un mínimo («oro o
más»), nunca un acabado exacto. No hay más sorteos por especie: los sobres los sustituyen.

## Sellos

Son datos de la especie: van en todos los acabados, hasta 2 por carta, y nunca deciden el acabado.

| Sello | Regla | Aves |
|---|---|---|
| Amenazada | `threatened` en el catálogo | 38 |
| Casi amenazada | NT en la UICN o en el Perú, si no está amenazada | 25 |
| Endémica | `endemic` en el catálogo | 8 |
| Emblemática | `emblematic` en el catálogo | 4 |

Una emblemática es la especie elegida para representar la identidad, la cultura, la historia, la fauna
y los valores de un país, una región o una comunidad específica.

El estado impreso en la carta usa la categoría más alta entre la UICN y la lista del Perú.

## La carta

La ficha de un ave y el revelado muestran la carta completa, con su reverso. El álbum conserva el
sticker como miniatura, con sus sellos y el destello del acabado.

- **Estructura:** hábitat como tipo, observaciones propias, familia, peso y ala, 2 rasgos, dieta, hábitat
  y estado. Rubí y diamante llevan el paisaje a toda la carta.
- **Brillo:** de holográfico a diamante, un destello pasa solo cada 7 a 4,5 s y otro responde al dedo.
  La carta normal no brilla.
- **Datos:** dentro del paquete, sin tocar Firestore. Peso y ala salen de AVONET, y los textos, de
  `data/species/ica-families.json`. **Son un borrador sin la revisión del biólogo.**
- **Sobres:** los 3 diseños salen al azar en cada sobre y son solo apariencia. Llegan en la fase 2A.
- **Maqueta:** [Cartas Plumario](https://claude.ai/artifact/KKe7hPAAPX9FTNExLSsuKk), página V2.

## Observaciones válidas

Una foto validada entra en la galería, pero solo avanza hitos, sobres y plumas si cuenta como
observación.

- **Tope:** 1 observación por especie y día.
- **Aves amenazadas:** 1 observación por semana en las especies con `threatened`, para no empujar a
  volver a colonias y nidos. Hoy son 38.
- **Foto repetida:** el mismo archivo no cuenta dos veces. Se rechaza con `photoClaims`.
- **Fallo de Gemini:** foto y sticker entran; contador, sobre y plumas esperan a revalidar.

| Foto que no cuenta | Texto |
|---|---|
| Ya contó hoy | Hoy ya contó. Vuelve mañana. |
| Especie amenazada | Cuenta una vez por semana para no molestarla. |
| Foto repetida | Esta foto ya está en tu álbum. |
| En revisión | La revisaremos pronto. |

**Detalle técnico:** el día sale de `takenAt` en `America/Lima`, para que una salida sin señal cuente
los días reales. Como `takenAt` lo manda el cliente, el servidor admite como máximo 3 observaciones por
especie y día de servidor.

## Sobres

- Sale 1 sobre cada 3 observaciones válidas, en cualquier especie.
- Trae 1 pieza de una de esas 3 aves, para que dependa de lo que viste y las aves raras sigan escasas.
- Tabla: 75 % plata, 20 % oro, 4 % rubí y 1 % diamante.

Si la pieza supera tu acabado en esa especie, se pega en el álbum. Si no, es una repetida. Los sobres
no traen holográficos, así que no hay repetidas de ese acabado.

## Plumas

Se ganan así:

| Vía | Plumas |
|---|---|
| Observación válida | 1 |
| Hito ya cubierto | 3, 5, 10, 25 o 60, de holográfico a diamante, sin crear copia |
| Reciclar una repetida | 2, 5, 12 o 30, de plata a diamante |
| Trivia | Máximo 1 al día |

Un hito cubierto por una compra no paga plumas: sería un reembolso de lo comprado. **Plumas y sobres
nunca se venden por dinero.**

Con esta tabla de sobres, los hitos bajos suelen llegar ya cubiertos. Pagar plumas en ellos es el caso
normal, no una excepción.

## Compra

Precios: holográfico 6, plata 10, oro 20, rubí 50 y diamante 120 plumas.

- Solo aves registradas. La foto sigue siendo la única forma de sumar un ave al álbum.
- Solo el acabado siguiente al que tienes en esa especie.
- Máximo 1 rubí o diamante al mes.

## Intercambio

Uno por uno, y cada parte entrega el mismo acabado.

- Solo se recibe un acabado superior al propio en esa especie, y de un ave que ya registraste.
- Quien entrega da una repetida; si no la tiene, paga el precio de ese acabado en plumas, y debe
  haberlo ganado por sí mismo.
- Lo recibido se queda en el álbum y no se puede volver a ofrecer.
- El álbum de quien entrega no pierde nada.
- No se comparten fotos ni ubicación.

Una propuesta no reserva piezas ni plumas: se valida en la transacción que acepta el intercambio.

## Trivia

Después del intercambio. Son 5 preguntas al día con las ilustraciones del álbum y dan 1 pluma al
terminar, como máximo una vez al día.

## Modelo de datos previsto

Solo escribe el servidor. El detalle se cierra en la fase que lo necesite.

| Concepto | Dónde | Campos |
|---|---|---|
| Colección | `users/{uid}/stickers/{speciesId}` | `best`, `unlocked` (acabado, origen y fecha) |
| Progreso | el mismo documento | `observations`, `ownBest` (ganado sin intercambio), `claimedMilestone`, `lastCountedAt` |
| Saldo | `users/{uid}/economy/wallet` | `feathers`, avance del sobre, compras altas del mes |
| Sobres | `users/{uid}/packs/{id}` | especies posibles, estado y resultado, que se decide al abrirlo |
| Repetidas | `users/{uid}/pieces/{speciesId}` | cantidad por acabado |
| Propuesta | `trades/{id}` | especie y acabado de cada lado |
| Eventos únicos | `result` del registro y de la aceptación, `photoClaims` | lo que ya se otorgó |

Origen de un acabado: `luck`, `milestone`, `pack`, `purchase` o `trade`. `validPhotos` queda solo para
la galería. Como `claimedMilestone` nunca baja, un hito no se cobra dos veces aunque una revisión reste
observaciones.

**Revisión posterior:** si una observación se invalida, se restan observaciones y plumas, aunque el
saldo quede negativo. Lo ya entregado solo se retira por fraude.

## Datos actuales

No hay migración. Los datos de usuarios se borran al lanzar la fase 1 y el catálogo se conserva. Antes
de borrar se pide confirmación expresa.

## Fases

| Fase | Entrega |
|---|---|
| 0 | Esta especificación, artboards, tope de IA en servidor, SHA-256, cierre de `allow delete` y selector de privacidad |
| 1 | Acabado ganado, elegibilidad, hitos y borrado de datos de usuarios, con el intercambio en pausa |
| 2A | Sobres, repetidas, plumas, reciclaje y compra |
| 2B | Intercambio |
| 3 | Colecciones y trivia |
| 4 | Perfil público y tops |

## Casos que debe cubrir la implementación

1. La primera observación sin suerte solo registra el sticker normal.
2. Con suerte en la primera, el hito 3 paga 3 plumas y no crea copia.
3. Sin mejora previa, las observaciones 3, 5, 10, 20 y 35 dan su acabado.
4. Una especie común puede llegar a diamante sin que cambien sus datos.
5. Un hito cubierto por suerte o por un sobre paga plumas; uno cubierto por compra, no.
6. Una segunda foto de la misma especie el mismo día entra en la galería y no avanza nada.
7. El mismo archivo se rechaza, aunque llegue en otro registro o a la vez que el primero.
8. Cada 3 observaciones válidas sale exactamente un sobre, sin duplicarse con reintentos.
9. El sobre solo trae piezas de sus 3 aves, y sus cuatro probabilidades suman 100 %.
10. Una pieza que no supera tu acabado queda como repetida y el álbum no retrocede.
11. La compra rechaza aves sin registrar, saltos de nivel y un segundo rubí o diamante en el mes.
12. Intercambiar no reduce el álbum ni suma observaciones, y lo recibido no se puede volver a ofrecer.
13. Dos aceptaciones simultáneas no gastan dos veces la misma repetida ni el mismo saldo.
14. Los logros de colección no se conceden otra vez al reconstruir las vistas.
15. Con Gemini caído, la foto entra y la recompensa espera a revalidar.
16. El borrado de datos de la fase 1 conserva el catálogo.
