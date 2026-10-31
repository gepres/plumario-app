import type { CardCategory, ChromeSource, Seal } from '@plumario/core';

// Textos de los cromos (CategoriasCromos, StickerDetalle, GaleriaEspecie).

export const CATEGORY_LABELS: Record<CardCategory, string> = {
  holographic: 'holográfico',
  silver: 'plata',
  gold: 'oro',
  ruby: 'rubí',
  diamond: 'diamante',
};

/** Por qué una especie tiene su categoría («cromo rubí, por ser emblemática»). */
export const CATEGORY_REASONS: Record<CardCategory, string | null> = {
  holographic: null,
  silver: 'por estar casi amenazada',
  gold: 'por ser endémica',
  ruby: 'por ser emblemática',
  diamond: 'por estar amenazada',
};

export const SEAL_LABELS: Record<Seal, string> = {
  threatened: 'Amenazada',
  emblematic: 'Emblemática',
  endemic: 'Endémica',
  nearThreatened: 'Casi amenazada',
};

/** Qué significa cada sello, en el reverso de la carta. */
export const SEAL_MEANINGS: Record<Seal, string> = {
  threatened: 'Su población está en riesgo.',
  emblematic: 'Elegida como símbolo de su región.',
  endemic: 'Solo vive en Perú.',
  nearThreatened: 'Podría estar en riesgo pronto.',
};

/** Las categorías de la UICN y de la lista del Perú. */
export const CONSERVATION_LABELS: Record<string, string> = {
  LC: 'Preocupación menor',
  NT: 'Casi amenazada',
  VU: 'Vulnerable',
  EN: 'En peligro',
  CR: 'En peligro crítico',
  DD: 'Datos insuficientes',
  NE: 'Sin evaluar',
};

export const CHROME_SOURCE_LABELS: Record<ChromeSource, string> = {
  luck: 'Al azar, al completar su sticker.',
  photos: 'Con 5 fotos validadas de la especie.',
  trade: 'Por intercambio.',
};

/** Cómo se obtuvo, en corto, para el reverso de la carta. */
export const CHROME_SOURCE_SHORT: Record<ChromeSource, string> = {
  luck: 'Al azar',
  photos: '5 fotos',
  trade: 'Intercambio',
};

const longDate = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

/** «23 de octubre de 2026». */
export const formatLongDate = (date: Date) => longDate.format(date);

/** «14 mar 2026». */
export const formatShortDate = (date: Date) => shortDate.format(date).replace('.', '');

const dayMonth = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' });

/** «23 oct», para listas donde el año sobra. */
export const formatDayMonth = (date: Date) => dayMonth.format(date).replace('.', '');
