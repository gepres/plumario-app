import type { Species } from './species';

// Cromos por categoría (design/project/CategoriasCromos.dc.html). Cada especie tiene una categoría
// fija; el sticker normal no cambia, la categoría solo se ve cuando la especie sale en cromo.

export type CardCategory = 'holographic' | 'silver' | 'gold' | 'ruby' | 'diamond';

/** Si cumple varias, gana la más alta: Diamante › Rubí › Oro › Plata › Holográfico. */
export const CATEGORY_RANK: Record<CardCategory, number> = { holographic: 0, silver: 1, gold: 2, ruby: 3, diamond: 4 };

/** «Al completar sale cromo 1 de cada 8, sea cual sea la categoría. Valor configurable.» */
export const CHROME_CHANCE = 1 / 8;

/** «Con 5 fotos validadas, su sticker pasa a cromado.» */
export const PHOTOS_FOR_CHROME = 5;

const THREATENED_IUCN = new Set(['VU', 'EN', 'CR']);

export function categoryOf(species: Pick<Species, 'iucn' | 'endemic' | 'emblematic'>): CardCategory {
  if (species.iucn && THREATENED_IUCN.has(species.iucn)) return 'diamond';
  if (species.emblematic) return 'ruby';
  if (species.endemic) return 'gold';
  if (species.iucn === 'NT') return 'silver';
  return 'holographic';
}

/** «Intercambio parejo: uno por uno, dando un cromo de la misma categoría o superior a la que pides.» */
export function isFairTrade(offered: CardCategory, requested: CardCategory): boolean {
  return CATEGORY_RANK[offered] >= CATEGORY_RANK[requested];
}
