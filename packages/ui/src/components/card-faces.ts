import type { stickerTints } from '@plumario/tokens';

import type { StickerFinish } from './bird-sticker';

// Cómo se pinta la carta en cada acabado (Cartas Plumario, V2Carta). Cada acabado cambia el material y
// la estructura: los dos últimos llevan el paisaje a toda la carta.

export type CardHabitat = keyof typeof stickerTints;

export type CardFace = {
  /** El paisaje ocupa toda la carta y las placas son translúcidas. */
  fullArt: boolean;
  plate: string;
  plateEdge: string;
  /** Filete de la ventana y de los medallones. */
  trim: string | null;
  ink: string;
  inkSoft: string;
  line: string;
  /** Velo sobre el paisaje, para que se sienta del mismo material. */
  veil: string | null;
  /** Colores de la franja de luz; sin ellos, el acabado no brilla. */
  shine: readonly string[] | null;
  /** Cada cuánto pasa el destello: cuanto más alto el acabado, más vivo. */
  period: number;
  sparkles: readonly { x: number; y: number; size: number }[];
  sparkleColor: string;
};

const PAPER = { plate: '#FBF6E9', ink: '#1E2A1B', inkSoft: '#4F5B43', line: 'rgba(30,42,27,0.3)' };
const PAPER_EDGE = 'rgba(0,0,0,0.28)';
const PRISM = ['#F4C6D6', '#C5D9F5', '#C3EEDC', '#F2EAB8'];
const FEW_SPARKLES = [{ x: 30, y: 76, size: 12 }, { x: 258, y: 150, size: 14 }];

const NONE = { veil: null, shine: null, period: 0, sparkles: [], sparkleColor: '#FFFFFF' };

export const CARD_FACES: Record<StickerFinish, CardFace> = {
  normal: { ...NONE, ...PAPER, fullArt: false, plateEdge: PAPER_EDGE, trim: null },
  holographic: {
    ...NONE, ...PAPER, fullArt: false, plateEdge: PAPER_EDGE, trim: '#FFFFFF',
    shine: PRISM, period: 7000, sparkles: FEW_SPARKLES,
  },
  silver: {
    ...NONE, plate: '#F2F5F7', ink: '#1E2A31', inkSoft: '#3E4B54', line: 'rgba(30,40,48,0.3)',
    fullArt: false, plateEdge: PAPER_EDGE, trim: '#F2F5F7', veil: 'rgba(210,225,235,0.12)',
    shine: ['#FFFFFF'], period: 6500, sparkles: FEW_SPARKLES,
  },
  gold: {
    ...NONE, plate: '#FFF6DC', ink: '#3B2A0C', inkSoft: '#5E4516', line: 'rgba(74,52,16,0.34)',
    fullArt: false, plateEdge: PAPER_EDGE, trim: '#FFF1BC', veil: 'rgba(255,214,120,0.15)',
    shine: ['#FFE9A8'], period: 6000, sparkles: FEW_SPARKLES, sparkleColor: '#FFF6D5',
  },
  ruby: {
    ...NONE, plate: 'rgba(46,6,16,0.84)', ink: '#FFFFFF', inkSoft: '#F8E1E5', line: 'rgba(255,255,255,0.34)',
    fullArt: true, plateEdge: 'rgba(255,201,209,0.35)', trim: '#FFC9D1', veil: 'rgba(122,18,38,0.18)',
    shine: ['#FFC2CD'], period: 5500, sparkleColor: '#FFE7A8',
    sparkles: [{ x: 26, y: 84, size: 14 }, { x: 258, y: 146, size: 18 }, { x: 36, y: 212, size: 10 }],
  },
  diamond: {
    ...NONE, plate: 'rgba(12,34,52,0.84)', ink: '#FFFFFF', inkSoft: '#E4F2F9', line: 'rgba(255,255,255,0.36)',
    fullArt: true, plateEdge: 'rgba(214,238,250,0.45)', trim: '#E4F2F9', veil: 'rgba(181,210,226,0.16)',
    shine: PRISM, period: 4500,
    sparkles: [
      { x: 24, y: 76, size: 20 }, { x: 262, y: 128, size: 12 }, { x: 260, y: 170, size: 22 },
      { x: 30, y: 190, size: 14 }, { x: 150, y: 66, size: 9 }, { x: 228, y: 222, size: 9 },
    ],
  },
};

/** Tinta oscura de cada hábitat, para los medallones y la cinta de la carta. */
export const HABITAT_INKS: Record<CardHabitat, string> = {
  coast: '#123F4B',
  wetlands: '#2B4A1E',
  desert: '#5E4216',
  highlands: '#3C3358',
  openSea: '#16324A',
};

/** Qué franja del paisaje se ve en la ventana de la carta (0 arriba, 1 abajo). */
export const SCENE_FOCUS: Record<CardHabitat, number> = { coast: 0.58, wetlands: 0.6, desert: 0.86, highlands: 0.45, openSea: 0.62 };

/** Trazo del ícono de cada hábitat, en una caja de 24 × 24. */
export const HABITAT_ICONS: Record<CardHabitat, string> = {
  coast: 'M2 15c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0M2 9c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0',
  wetlands: 'M12 21V8M12 8c0-2 1-4 3-5M6 21c0-4-1-7-3-9M18 21c0-4 1-7 3-9',
  desert: 'M3 19c4-5 8-6 11-4s5 2 7 1M12 4v2M6 7l1.4 1.4M18 7l-1.4 1.4M8.5 13a3.5 3.5 0 1 1 7 0',
  highlands: 'M3 20l6-11 4 7 3-4 5 8z',
  openSea: 'M12 3v15M12 3l6 11h-6M5 18c2 2 4 2 7 2s5 0 7-2',
};
