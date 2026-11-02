import type { CardCategory, CoveredMilestone, EconomyErrorCode, FinishSource, PackDesign, PieceFinish } from '@plumario/core';

// Textos de plumas, sobres y repetidas (SobreAbrir, SobreResultado, MisRepetidas, CompraAcabado).

export const feathersLabel = (feathers: number) => (feathers === 1 ? '1 pluma' : `${feathers} plumas`);

/** Con su artículo, para escribirlo en medio de una frase. */
export const FINISH_WITH_ARTICLE: Record<CardCategory, string> = {
  holographic: 'el holográfico',
  silver: 'la plata',
  gold: 'el oro',
  ruby: 'el rubí',
  diamond: 'el diamante',
};

/** «Oro repetido». */
export const REPEATED_TITLES: Record<PieceFinish, string> = {
  silver: 'Plata repetida',
  gold: 'Oro repetido',
  ruby: 'Rubí repetido',
  diamond: 'Diamante repetido',
};

const COVERED_BY: Record<FinishSource, string> = {
  luck: 'Tu primera foto ya te dio',
  milestone: 'Ya tenías',
  pack: 'Tu sobre ya te dio',
  purchase: 'Ya tenías',
  trade: 'Un intercambio ya te dio',
};

/** «Tu sobre ya te dio el oro · +10 plumas». */
export const coveredLabel = ({ finish, source, feathers }: CoveredMilestone) => `${COVERED_BY[source]} ${FINISH_WITH_ARTICLE[finish]} · +${feathersLabel(feathers)}`;

export const PACK_TITLES: Record<PackDesign, { color: string; alt: string }> = {
  nasca: { color: '#F7DE8E', alt: 'Sobre con el colibrí de las líneas de Nasca en oro sobre el desierto de noche' },
  pelicans: { color: '#FFE9B8', alt: 'Sobre con pelícanos cruzando el sol sobre los acantilados de Paracas' },
  paracas: { color: '#F7DE8E', alt: 'Sobre con un ave de alas abiertas al estilo de los mantos bordados de Paracas' },
};

export const ECONOMY_ERRORS: Record<EconomyErrorCode, string> = {
  'not-registered': 'Primero registra esta ave con una foto.',
  'top-finish': 'Esta carta ya llegó a diamante.',
  'not-next': 'Esta carta ya cambió. Vuelve a mirarla.',
  'monthly-limit': 'Ya compraste un rubí o diamante este mes.',
  'not-enough': 'Te faltan plumas.',
  'no-piece': 'Esa repetida ya no está.',
  'no-pack': 'No encontramos ese sobre.',
  unavailable: 'No se pudo. Revisa tu conexión y vuelve a intentar.',
};
