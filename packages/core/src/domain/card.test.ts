import { describe, expect, it } from 'vitest';

import { MILESTONES, betterFinish, isFairTrade, nextFinishMilestone } from './card';

describe('escalera de acabados', () => {
  it('los hitos van de holográfico a diamante', () => {
    expect(MILESTONES.map((m) => [m.observations, m.finish])).toEqual([[3, 'holographic'], [5, 'silver'], [10, 'gold'], [20, 'ruby'], [35, 'diamond']]);
  });

  it('el mejor de dos acabados nunca es menor que el que ya tenías', () => {
    expect(betterFinish('gold', 'silver')).toBe('gold');
    expect(betterFinish(null, 'silver')).toBe('silver');
    expect(betterFinish('ruby', null)).toBe('ruby');
    expect(betterFinish(null, null)).toBeNull();
  });

  it('dice qué hito sigue', () => {
    expect(nextFinishMilestone(0, null)).toMatchObject({ observations: 3 });
    expect(nextFinishMilestone(3, 'holographic')).toMatchObject({ observations: 5 });
    // Los que ya cubrió un sobre o una compra no cuentan: esos solo pagan plumas.
    expect(nextFinishMilestone(2, 'gold')).toMatchObject({ observations: 20, finish: 'ruby' });
    expect(nextFinishMilestone(2, 'diamond')).toBeNull();
  });
});

describe('isFairTrade', () => {
  it('se da un cromo de igual o mayor categoría que el que se pide', () => {
    expect(isFairTrade('gold', 'gold')).toBe(true);
    expect(isFairTrade('diamond', 'silver')).toBe(true);
    expect(isFairTrade('silver', 'ruby')).toBe(false);
  });
});
