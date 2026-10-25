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

export const CHROME_SOURCE_LABELS: Record<ChromeSource, string> = {
  luck: 'Al azar, al completar su sticker.',
  photos: 'Con 5 fotos validadas de la especie.',
  trade: 'Por intercambio.',
};

const longDate = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

/** «23 de octubre de 2026». */
export const formatLongDate = (date: Date) => longDate.format(date);

/** «14 mar 2026». */
export const formatShortDate = (date: Date) => shortDate.format(date).replace('.', '');
