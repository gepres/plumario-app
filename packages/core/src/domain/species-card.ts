import type { Species } from './species';

// Lo que imprime la carta de una especie (docs/card-progression.md): sellos, estado de conservación
// y medidas. Son datos de la especie: ninguno decide el acabado.

export type Seal = 'threatened' | 'nearThreatened' | 'endemic' | 'emblematic';

export type ConservationScope = 'global' | 'peru';

export type ConservationStatus = {
  category: string;
  /** De qué lista sale: la del Perú solo se usa cuando es más alta que la de la UICN. */
  scope: ConservationScope;
};

type ConservationData = Pick<Species, 'iucn' | 'nationalCategory'>;

// De menor a mayor riesgo. DD y NE no dicen cuánto riesgo hay: no le ganan a ninguna categoría.
const RISK_ORDER = ['LC', 'NT', 'VU', 'EN', 'CR'];
const riskOf = (category: string | null) => RISK_ORDER.indexOf(category ?? '');

/** La categoría más alta entre la UICN y la lista del Perú. */
export function conservationStatus({ iucn, nationalCategory }: ConservationData): ConservationStatus | null {
  if (nationalCategory && riskOf(nationalCategory) > riskOf(iucn)) return { category: nationalCategory, scope: 'peru' };
  return iucn ? { category: iucn, scope: 'global' } : null;
}

/**
 * Los sellos de una especie: primero su conservación, después lo demás. Amenazada le gana a casi
 * amenazada, porque la UICN y la lista del Perú pueden no coincidir.
 */
export function speciesSeals(species: Pick<Species, 'threatened' | 'endemic' | 'emblematic'> & ConservationData): Seal[] {
  const seals: Seal[] = [];
  if (species.threatened) seals.push('threatened');
  else if (species.iucn === 'NT' || species.nationalCategory === 'NT') seals.push('nearThreatened');
  if (species.endemic) seals.push('endemic');
  if (species.emblematic) seals.push('emblematic');
  return seals;
}

const decimal = (value: number) => value.toFixed(1).replace(/\.0$/, '').replace('.', ',');

/** «151 g» o «3,4 kg». */
export const formatMass = (grams: number) => (grams < 1000 ? `${Math.round(grams)} g` : `${decimal(grams / 1000)} kg`);

/** «ala 62 cm» o, en aves pequeñas, «ala 10,3 cm». */
export function formatWing(millimeters: number) {
  const centimeters = millimeters / 10;
  return `ala ${centimeters < 20 ? decimal(centimeters) : Math.round(centimeters)} cm`;
}
