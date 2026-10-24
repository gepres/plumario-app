// Acabados de los cromos por categoría (GuiaFundamentos, «Hábitats y categorías de cromo»).
// No dependen de la paleta: un cromo de oro es de oro en claro y en oscuro.
// Los cónicos se pintan con un barrido (Skia: SweepGradient); `from` es el ángulo de inicio.

import type { GradientStop } from './gradient';

export type CardFinish =
  | { type: 'conic'; from: number; colors: readonly string[]; css: string }
  | { type: 'linear'; angle: number; stops: readonly GradientStop[]; css: string };

export const cardFinishes = {
  holographic: {
    type: 'conic',
    from: 210,
    colors: ['#F4C6D6', '#C5D9F5', '#C3EEDC', '#F2EAB8', '#DEC8F2', '#F4C6D6'],
    css: 'conic-gradient(from 210deg, #F4C6D6, #C5D9F5, #C3EEDC, #F2EAB8, #DEC8F2, #F4C6D6)',
  },
  silver: {
    type: 'linear',
    angle: 135,
    stops: [{ color: '#F2F4F6', position: 0 }, { color: '#8F9BA4', position: 0.5 }, { color: '#E9EDF0', position: 1 }],
    css: 'linear-gradient(135deg, #F2F4F6, #8F9BA4 50%, #E9EDF0)',
  },
  gold: {
    type: 'linear',
    angle: 135,
    stops: [{ color: '#FFF4C9', position: 0 }, { color: '#B9872A', position: 0.5 }, { color: '#F5D987', position: 1 }],
    css: 'linear-gradient(135deg, #FFF4C9, #B9872A 50%, #F5D987)',
  },
  ruby: {
    type: 'linear',
    angle: 135,
    stops: [{ color: '#E37A8C', position: 0 }, { color: '#7A1226', position: 0.5 }, { color: '#C9566A', position: 1 }],
    css: 'linear-gradient(135deg, #E37A8C, #7A1226 50%, #C9566A)',
  },
  diamond: {
    type: 'conic',
    from: 22,
    colors: ['#F7FCFF', '#B5D2E2', '#FFFFFF', '#A9C8DA', '#F7FCFF'],
    css: 'conic-gradient(from 22deg, #F7FCFF, #B5D2E2, #FFFFFF, #A9C8DA, #F7FCFF)',
  },
} as const satisfies Record<string, CardFinish>;

export type CardCategory = keyof typeof cardFinishes;
