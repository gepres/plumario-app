import { describe, expect, it } from 'vitest';

import { at, sticker } from '../testing';
import { MILESTONES, nextFinishMilestone } from './card';
import { SERVER_DAILY_LIMIT, applyValidPhoto, limaDay, observationBlock, type Sticker } from './sticker';

const common = { id: 'playero', threatened: false };
const threatened = { id: 'zarcillo', threatened: true };
const NO_LUCK = 0.99;
const LUCK = 0.01;

/** Un sticker tras `count` observaciones, una por día, a partir del 1 de octubre. */
function observed(count: number, roll = NO_LUCK) {
  let current: Sticker | null = null;
  const outcomes = [];
  for (let day = 1; day <= count; day++) {
    const outcome = applyValidPhoto({ current, species: common, takenAt: at(day), at: at(day), roll, verified: true });
    outcomes.push(outcome);
    current = outcome.sticker;
  }
  return { sticker: current!, outcomes };
}

describe('primera observación', () => {
  it('sin suerte solo registra el sticker normal', () => {
    const { outcomes, sticker: result } = observed(1);
    expect(outcomes[0]).toMatchObject({ completed: true, counted: true, unlocked: null });
    expect(result).toMatchObject({ observations: 1, validPhotos: 1, best: null });
  });

  it('con suerte da holográfico y el hito 3 queda cubierto, sin crear otra copia', () => {
    const { outcomes, sticker: result } = observed(3, LUCK);
    expect(outcomes[0]!.unlocked).toMatchObject({ finish: 'holographic', source: 'luck' });
    expect(outcomes[2]).toMatchObject({ unlocked: null, coveredMilestone: 3 });
    expect(result.unlocked).toHaveLength(1);
    expect(result.claimedMilestone).toBe(3);
  });
});

describe('hitos', () => {
  it('las observaciones 3, 5, 10, 20 y 35 dan su acabado', () => {
    const { outcomes, sticker: result } = observed(35);
    for (const { observations, finish } of MILESTONES) {
      expect(outcomes[observations - 1]!.unlocked).toMatchObject({ finish, source: 'milestone' });
    }
    expect(result).toMatchObject({ best: 'diamond', ownBest: 'diamond', claimedMilestone: 35 });
    expect(result.unlocked).toHaveLength(5);
  });

  it('una especie común puede llegar a diamante', () => {
    expect(observed(35).sticker.best).toBe('diamond');
  });

  it('entre hitos no pasa nada y dice cuál sigue', () => {
    const { outcomes } = observed(4);
    expect(outcomes[3]).toMatchObject({ counted: true, unlocked: null, coveredMilestone: null });
    expect(nextFinishMilestone(4)).toMatchObject({ observations: 5, finish: 'silver' });
    expect(nextFinishMilestone(35)).toBeNull();
  });

  it('un acabado alto no retrocede cuando llega un hito menor', () => {
    const current = sticker('playero', { observations: 2, lastCountedAt: at(2), best: 'gold', ownBest: 'gold' });
    const outcome = applyValidPhoto({ current, species: common, takenAt: at(3), at: at(3), roll: NO_LUCK, verified: true });
    expect(outcome.sticker.best).toBe('gold');
    expect(outcome).toMatchObject({ unlocked: null, coveredMilestone: 3 });
    expect(outcome.sticker.claimedMilestone).toBe(3);
  });

  it('un hito ya cobrado no se cobra otra vez, aunque se resten observaciones', () => {
    const current = sticker('playero', { observations: 2, lastCountedAt: at(2), claimedMilestone: 3, best: 'holographic' });
    const outcome = applyValidPhoto({ current, species: common, takenAt: at(3), at: at(3), roll: NO_LUCK, verified: true });
    expect(outcome).toMatchObject({ unlocked: null, coveredMilestone: null });
  });
});

describe('elegibilidad', () => {
  it('una segunda foto del mismo día va a la galería y no avanza nada', () => {
    const current = sticker('playero', { observations: 1, lastCountedAt: at(5) });
    const outcome = applyValidPhoto({ current, species: common, takenAt: at(5), at: at(5), roll: LUCK, verified: true });
    expect(outcome).toMatchObject({ counted: false, blocked: 'today', unlocked: null });
    expect(outcome.sticker).toMatchObject({ validPhotos: 2, observations: 1 });
  });

  it('el día sale de Lima: las 23:00 y las 00:30 de Lima son días distintos', () => {
    const lastNight = new Date('2026-10-05T04:00:00Z');
    const afterMidnight = new Date('2026-10-05T05:30:00Z');
    expect(limaDay(afterMidnight) - limaDay(lastNight)).toBe(1);
    expect(observationBlock(sticker('playero', { lastCountedAt: lastNight }), common, afterMidnight, afterMidnight)).toBeNull();
  });

  it('una especie amenazada cuenta una vez por semana', () => {
    const current = sticker('zarcillo', { observations: 1, lastCountedAt: at(1) });
    expect(observationBlock(current, threatened, at(7), at(7))).toBe('week');
    expect(observationBlock(current, threatened, at(8), at(8))).toBeNull();
  });

  it('una salida sin señal cuenta por el día de la foto, con tope por día de servidor', () => {
    let current: Sticker | null = sticker('playero', { observations: 1, lastCountedAt: at(1) });
    const blocks = [];
    for (let day = 2; day <= 2 + SERVER_DAILY_LIMIT; day++) {
      const outcome = applyValidPhoto({ current, species: common, takenAt: at(day), at: at(20), roll: NO_LUCK, verified: true });
      blocks.push(outcome.blocked);
      current = outcome.sticker;
    }
    expect(blocks).toEqual([null, null, null, 'server-limit']);
    expect(current!.observations).toBe(4);
  });

  it('una fecha en el futuro no adelanta el contador', () => {
    const current = sticker('playero', { observations: 1, lastCountedAt: at(5) });
    expect(observationBlock(current, common, at(25), at(5))).toBe('today');
  });
});

describe('sin revisión de la IA', () => {
  it('la foto y el sticker entran, y el contador espera', () => {
    const outcome = applyValidPhoto({ current: null, species: common, takenAt: at(1), at: at(1), roll: LUCK, verified: false });
    expect(outcome).toMatchObject({ completed: true, counted: false, blocked: 'review', unlocked: null });
    expect(outcome.sticker).toMatchObject({ validPhotos: 1, observations: 0, best: null });
  });
});
