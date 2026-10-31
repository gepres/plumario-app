import type { Paint } from './svg-paint';

// Los acabados del sticker cromado, uno por categoría (design/project/StickerAve.dc.html, TIER).
// Son de material, no de la paleta: un cromo de oro es de oro en claro y en oscuro. Las medidas van
// en las unidades del diseño (tarjeta de 160 × 205).

export type ChromeFinish = 'holographic' | 'silver' | 'gold' | 'ruby' | 'diamond';

type Star = { cx: number; cy: number; size: number; color: string };

export type FinishStyle = {
  card: Paint;
  /** El reflejo sobre toda la tarjeta; `stripes` es el cepillado de la plata. */
  holo: Paint | 'stripes' | null;
  frame: { stroke: string; width: number; inner?: string } | null;
  sheen: readonly Paint[];
  stars: readonly Star[];
  badge: { background: Paint; border: string; shadow: string; icon: string; iconFill: string; icon2?: string; icon2Fill?: string };
  name: string;
  nameShadow?: string;
  number: { color: string; background: string };
  cardShadow: string;
};

const ICON = {
  star: 'M12 2.5l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.8 6.2 20.1l1.5-6.5-5-4.4 6.6-.6z',
  shield: 'M12 2.5l7.5 3v6c0 4.6-3.2 8.4-7.5 10-4.3-1.6-7.5-5.4-7.5-10v-6z',
  pin: 'M12 2.2a7 7 0 0 0-7 7c0 5.2 7 12.6 7 12.6s7-7.4 7-12.6a7 7 0 0 0-7-7zm0 9.6a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2z',
  flag: 'M5 2.5h2.2v19H5z M8.2 3.5H19l-3.2 4.6L19 12.7H8.2z',
  gem: 'M7 3.5h10l4.5 5.5L12 21 2.5 9z',
  gemTop: 'M7 3.5h10l4.5 5.5h-19z',
};

/** El holográfico de las insignias y los sellos (también tokens.cardFinishes.holographic). */
export const HOLOGRAPHIC: Extract<Paint, { type: 'conic' }> = { type: 'conic', from: 210, colors: ['#F4C6D6', '#C5D9F5', '#C3EEDC', '#F2EAB8', '#DEC8F2', '#F4C6D6'] };

const even = (colors: string[], positions: number[]) => colors.map((color, i) => ({ color, position: positions[i]! }));
const star = (cx: number, cy: number, size: number, color: string): Star => ({ cx, cy, size, color });
const threeStars = (color: string) => [star(110, 40, 18, color), star(27, 122, 14, color), star(139, 104, 10, color)];
const shine = (color: string, peak: number): Paint => ({
  type: 'linear',
  angle: 120,
  stops: [{ color: `rgba(${color},0)`, position: 0.3 }, { color: `rgba(${color},${peak})`, position: 0.44 }, { color: `rgba(${color},0)`, position: 0.58 }],
});
const SHADOW = '0 1px 2px rgba(20,48,47,0.22), 0 8px 20px rgba(20,48,47,0.18)';
const BADGE_SHADOW = '0 2px 6px rgba(20,48,47,0.28)';

export const FINISHES: Record<ChromeFinish, FinishStyle> = {
  holographic: {
    card: { type: 'linear', angle: 135, stops: even(['#F7F9FA', '#B7C0C7', '#FFFFFF', '#9AA6AE', '#EEF1F3', '#AAB4BB', '#F4F6F7'], [0, 0.18, 0.34, 0.52, 0.7, 0.86, 1]) },
    holo: { type: 'conic', from: 200, at: [0.5, 0.45], colors: ['rgba(244,198,214,0.42)', 'rgba(197,217,245,0.42)', 'rgba(195,238,220,0.42)', 'rgba(242,234,184,0.42)', 'rgba(222,200,242,0.42)', 'rgba(244,198,214,0.42)'] },
    frame: null,
    sheen: [shine('255,255,255', 0.5), { type: 'conic', from: 90, at: [0.7, 0.3], colors: ['rgba(244,198,214,0.3)', 'rgba(197,217,245,0.3)', 'rgba(195,238,220,0.3)', 'rgba(242,234,184,0.3)', 'rgba(244,198,214,0.3)'] }],
    stars: threeStars('#FFFFFF'),
    badge: { background: HOLOGRAPHIC, border: '#FFFFFF', shadow: BADGE_SHADOW, icon: ICON.star, iconFill: '#14302F' },
    name: '#14302F',
    number: { color: '#14302F', background: '#FFFFFF' },
    cardShadow: SHADOW,
  },
  silver: {
    card: { type: 'linear', angle: 135, stops: even(['#F2F4F6', '#A7B1B9', '#E9EDF0', '#7E8B95', '#DCE1E5', '#8F9BA4', '#EEF1F3'], [0, 0.16, 0.3, 0.48, 0.64, 0.82, 1]) },
    holo: 'stripes',
    frame: { stroke: 'rgba(255,255,255,0.9)', width: 1, inner: 'rgba(60,72,80,0.3)' },
    sheen: [shine('255,255,255', 0.55)],
    stars: [star(110, 40, 14, '#FFFFFF'), star(27, 122, 10, '#FFFFFF')],
    badge: {
      background: { type: 'linear', angle: 135, stops: even(['#FFFFFF', '#B9C2C9', '#EEF1F3', '#95A1AA'], [0, 0.45, 0.62, 1]) },
      border: '#FFFFFF', shadow: BADGE_SHADOW, icon: ICON.star, iconFill: '#2F3B43',
    },
    name: '#1E2A31',
    number: { color: '#1E2A31', background: '#FFFFFF' },
    cardShadow: SHADOW,
  },
  gold: {
    card: { type: 'linear', angle: 135, stops: even(['#FFF4C9', '#E0B348', '#FFF1BC', '#B9872A', '#F5D987', '#A9781F', '#FCE7A2'], [0, 0.18, 0.34, 0.52, 0.7, 0.86, 1]) },
    holo: { type: 'radial', at: [0.28, 0.18], stops: [{ color: 'rgba(255,255,255,0.4)', position: 0 }, { color: 'rgba(255,255,255,0)', position: 0.48 }] },
    frame: { stroke: 'rgba(255,248,220,0.95)', width: 1, inner: 'rgba(120,82,18,0.35)' },
    sheen: [shine('255,240,190', 0.55)],
    stars: threeStars('#FFF6D5'),
    badge: {
      background: { type: 'linear', angle: 135, stops: even(['#FFF3C4', '#D9A93E', '#F7DE8E', '#B07F22'], [0, 0.5, 0.7, 1]) },
      border: '#FFF8E1', shadow: '0 2px 6px rgba(74,52,16,0.35)', icon: ICON.star, iconFill: '#4A3410',
    },
    name: '#3B2A0C',
    number: { color: '#3B2A0C', background: '#FFF8E6' },
    cardShadow: SHADOW,
  },
  ruby: {
    card: { type: 'linear', angle: 135, stops: even(['#E37A8C', '#A51E36', '#D24A60', '#7A1226', '#B8334A', '#64101F', '#C9566A'], [0, 0.2, 0.36, 0.54, 0.72, 0.88, 1]) },
    holo: { type: 'radial', at: [0.72, 0.14], stops: [{ color: 'rgba(255,255,255,0.3)', position: 0 }, { color: 'rgba(255,255,255,0)', position: 0.45 }] },
    frame: { stroke: '#E9C46A', width: 1.5 },
    sheen: [shine('255,255,255', 0.45)],
    stars: threeStars('#FFE7A8'),
    badge: {
      background: { type: 'linear', angle: 135, stops: even(['#E8687C', '#9C1B31', '#6A0F1F'], [0, 0.55, 1]) },
      border: '#E9C46A', shadow: '0 2px 6px rgba(60,10,20,0.4)', icon: ICON.star, iconFill: '#FFFFFF',
    },
    name: '#FFFFFF',
    nameShadow: 'rgba(40,0,10,0.45)',
    number: { color: '#6A0F1F', background: '#FFFFFF' },
    cardShadow: SHADOW,
  },
  diamond: {
    card: { type: 'conic', from: 22, at: [0.5, 0.4], colors: ['#F7FCFF', '#CDE5F1', '#FFFFFF', '#B5D2E2', '#EEF8FD', '#C4DEEC', '#FFFFFF', '#A9C8DA', '#F2FAFE', '#C9E2EF', '#F7FCFF'] },
    holo: {
      type: 'linear', angle: 115,
      stops: [{ color: 'rgba(197,217,245,0)', position: 0.18 }, { color: 'rgba(244,198,214,0.38)', position: 0.36 }, { color: 'rgba(195,238,220,0.38)', position: 0.5 }, { color: 'rgba(242,234,184,0.32)', position: 0.62 }, { color: 'rgba(197,217,245,0)', position: 0.78 }],
    },
    frame: { stroke: 'rgba(255,255,255,0.95)', width: 1, inner: 'rgba(80,140,170,0.35)' },
    sheen: [
      { type: 'linear', angle: 120, stops: [{ color: 'rgba(255,255,255,0)', position: 0.28 }, { color: 'rgba(255,255,255,0.6)', position: 0.42 }, { color: 'rgba(255,255,255,0)', position: 0.56 }] },
      { type: 'conic', from: 90, at: [0.7, 0.3], colors: ['rgba(197,217,245,0.28)', 'rgba(244,198,214,0.28)', 'rgba(195,238,220,0.28)', 'rgba(197,217,245,0.28)'] },
    ],
    stars: [star(110, 40, 20, '#FFFFFF'), star(27, 122, 16, '#FFFFFF'), star(139, 104, 12, '#FFFFFF'), star(34, 30, 10, '#FFFFFF'), star(112, 140, 9, '#FFFFFF')],
    badge: { background: { type: 'solid', color: '#16324A' }, border: '#FFFFFF', shadow: '0 0 0 2px #BFE3F2, 0 2px 8px rgba(20,48,47,0.35)', icon: ICON.gem, iconFill: '#9FD3EA', icon2: ICON.gemTop, icon2Fill: '#FFFFFF' },
    name: '#14302F',
    number: { color: '#16324A', background: '#FFFFFF' },
    cardShadow: '0 1px 2px rgba(20,48,47,0.22), 0 8px 22px rgba(44,106,134,0.34)',
  },
};
