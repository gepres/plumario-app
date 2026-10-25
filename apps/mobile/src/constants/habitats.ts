import type { Habitat } from '@plumario/core';
import { stickerTints } from '@plumario/tokens';

/** Nombres cortos de los hábitats (Inicio). */
export const HABITAT_LABELS: Record<Habitat, string> = {
  coast: 'Litoral',
  wetlands: 'Humedales',
  desert: 'Desierto',
  highlands: 'Sierra',
  openSea: 'Mar abierto',
};

/** Nombres de las secciones del álbum (design/project/Album.dc.html). */
export const ALBUM_HABITAT_LABELS: Record<Habitat, string> = {
  coast: 'Litoral y mar',
  wetlands: 'Humedales',
  desert: 'Desierto, valles y ciudad',
  highlands: 'Sierra y puna',
  openSea: 'Mar abierto',
};

/** La medalla de cada hábitat y qué se registra para ganarla (HabitatLitoral). */
export const HABITAT_MEDALS: Record<Habitat, { title: string; places: string }> = {
  coast: { title: 'Medalla del litoral', places: 'playas, islas y acantilados' },
  wetlands: { title: 'Medalla de los humedales', places: 'lagunas, totorales y desembocaduras' },
  desert: { title: 'Medalla del desierto', places: 'el desierto, los valles y la ciudad' },
  highlands: { title: 'Medalla de la sierra', places: 'quebradas, sierra y puna' },
  openSea: { title: 'Medalla del mar abierto', places: 'mar adentro, lejos de la costa' },
};

/** Color de la placa del sticker de una especie según su hábitat; sin hábitat, el del litoral. */
export const stickerTint = (habitat: Habitat | null) => stickerTints[habitat ?? 'coast'];
