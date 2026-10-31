import type { CardCategory, FinishSource, NotCounted, Seal } from '@plumario/core';

// Textos de los cromos (CategoriasCromos, StickerDetalle, GaleriaEspecie).

export const CATEGORY_LABELS: Record<CardCategory, string> = {
  holographic: 'holográfico',
  silver: 'plata',
  gold: 'oro',
  ruby: 'rubí',
  diamond: 'diamante',
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

export const FINISH_SOURCE_LABELS: Record<FinishSource, string> = {
  luck: 'Por suerte, con tu primera foto.',
  milestone: 'Con tus observaciones.',
  pack: 'En un sobre.',
  purchase: 'Con plumas.',
  trade: 'Por intercambio.',
};

/** Cómo se obtuvo, en corto, para el reverso de la carta. */
export const FINISH_SOURCE_SHORT: Record<FinishSource, string> = {
  luck: 'Por suerte',
  milestone: 'Por hito',
  pack: 'En un sobre',
  purchase: 'Con plumas',
  trade: 'Intercambio',
};

/** Por qué una foto validada no contó como observación. */
export const NOT_COUNTED_LABELS: Record<NotCounted, string> = {
  today: 'Hoy ya contó. Vuelve mañana.',
  week: 'Cuenta una vez por semana para no molestarla.',
  'server-limit': 'Hoy ya contaron varias fotos de esta ave. Vuelve mañana.',
  review: 'La revisaremos pronto.',
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** «Plata», como título. */
export const finishTitle = (finish: CardCategory) => capitalize(CATEGORY_LABELS[finish]);

const longDate = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

/** «23 de octubre de 2026». */
export const formatLongDate = (date: Date) => longDate.format(date);

/** «14 mar 2026». */
export const formatShortDate = (date: Date) => shortDate.format(date).replace('.', '');

const dayMonth = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' });

/** «23 oct», para listas donde el año sobra. */
export const formatDayMonth = (date: Date) => dayMonth.format(date).replace('.', '');
