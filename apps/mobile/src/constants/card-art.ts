import type { ImageSourcePropType } from 'react-native';

import type { CardCategory, Habitat, Seal } from '@plumario/core';

// El arte de las cartas: va dentro del paquete para que se vean sin señal. Los originales están en
// data/cards/raw/ y se recortan con tools/cards/.

/** El marco de una carta normal: el relieve del color de su hábitat. */
export const HABITAT_FRAMES: Record<Habitat, ImageSourcePropType> = {
  coast: require('@/assets/cards/marco-litoral.webp'),
  wetlands: require('@/assets/cards/marco-humedales.webp'),
  desert: require('@/assets/cards/marco-desierto.webp'),
  highlands: require('@/assets/cards/marco-sierra.webp'),
  openSea: require('@/assets/cards/marco-mar.webp'),
};

/** El marco de cada acabado. */
export const FINISH_FRAMES: Record<CardCategory, ImageSourcePropType> = {
  holographic: require('@/assets/cards/marco-cromado.webp'),
  silver: require('@/assets/cards/marco-plata.webp'),
  gold: require('@/assets/cards/marco-oro.webp'),
  ruby: require('@/assets/cards/marco-rubi.webp'),
  diamond: require('@/assets/cards/marco-diamante.webp'),
};

/** El paisaje de cada hábitat. */
export const HABITAT_SCENES: Record<Habitat, ImageSourcePropType> = {
  coast: require('@/assets/cards/escena-litoral.webp'),
  wetlands: require('@/assets/cards/escena-humedales.webp'),
  desert: require('@/assets/cards/escena-desierto.webp'),
  highlands: require('@/assets/cards/escena-sierra.webp'),
  openSea: require('@/assets/cards/escena-mar.webp'),
};

export const SEAL_ART: Record<Seal, ImageSourcePropType> = {
  threatened: require('@/assets/cards/sello-amenazada.webp'),
  nearThreatened: require('@/assets/cards/sello-casi.webp'),
  endemic: require('@/assets/cards/sello-endemica.webp'),
  emblematic: require('@/assets/cards/sello-emblematica.webp'),
};

/** El relieve de plumas que enciende el destello. */
export const CARD_RELIEF: ImageSourcePropType = require('@/assets/cards/brillo-mascara.webp');

/** El dorso bordado, el que se ve antes de revelar una carta. */
export const CARD_BACK: ImageSourcePropType = require('@/assets/cards/dorso.webp');
