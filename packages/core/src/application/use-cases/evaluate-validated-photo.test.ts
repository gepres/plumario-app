import { describe, expect, it } from 'vitest';

import { achievementId } from '../../domain/achievements';
import { EMPTY_WALLET } from '../../domain/economy';
import { limaDay } from '../../domain/sticker';
import { at, species, sticker } from '../../testing';
import { evaluateRevalidatedPhoto, evaluateValidatedPhoto, sightingResultOf } from './evaluate-validated-photo';

const catalog = Array.from({ length: 12 }, (_, i) => species(`ave${i}`));
const photo = (day: number) => ({ wallet: EMPTY_WALLET, takenAt: at(day), at: at(day), roll: 0.5, verified: true });

describe('evaluateValidatedPhoto', () => {
  it('la primera foto de una especie completa el sticker y puede dar logros', () => {
    const result = evaluateValidatedPhoto({ species: catalog[0]!, catalog, stickers: [], ...photo(3) });
    expect(result).toMatchObject({ completed: true, counted: true });
    expect(result.achievements.map(achievementId)).toEqual(['first-bird']);
  });

  it('la décima especie da la medalla de 10', () => {
    const nine = Array.from({ length: 9 }, (_, i) => sticker(`ave${i}`));
    const result = evaluateValidatedPhoto({ species: catalog[9]!, catalog, stickers: nine, ...photo(4) });
    expect(result.achievements.map(achievementId)).toEqual(['milestone-10']);
  });

  it('una foto más de una especie ya registrada no da logros, pero avanza el hito', () => {
    const stickers = [sticker('ave0', { validPhotos: 2, observations: 2, countedDays: [limaDay(at(4))] })];
    const result = evaluateValidatedPhoto({ species: catalog[0]!, catalog, stickers, ...photo(5) });
    expect(result).toMatchObject({ completed: false, unlocked: { finish: 'holographic', source: 'milestone' } });
    expect(result.achievements).toEqual([]);
  });

  it('un mamífero tiene sticker, pero no cuenta para los logros del álbum de aves', () => {
    const lobo = species('lobo', { taxonClass: 'mammal' });
    const result = evaluateValidatedPhoto({ species: lobo, catalog: [...catalog, lobo], stickers: [], ...photo(6) });
    expect(result.completed).toBe(true);
    expect(result.achievements).toEqual([]);
  });

  it('el acabado no sale de la especie: un ave amenazada también empieza en normal', () => {
    const condor = species('condor', { iucn: 'VU', threatened: true, habitat: 'highlands' });
    expect(evaluateValidatedPhoto({ species: condor, catalog: [...catalog, condor], stickers: [], ...photo(7) }).sticker.best).toBeNull();
  });

  it('deja en el registro lo que pasó, el avance del hito y el del álbum', () => {
    const nine = Array.from({ length: 9 }, (_, i) => sticker(`ave${i}`));
    const result = evaluateValidatedPhoto({ species: catalog[9]!, catalog, stickers: nine, ...photo(8), roll: 0.9 });
    expect(sightingResultOf(result)).toEqual({
      outcome: 'validated', completed: true, counted: true, blocked: null, unlocked: null, finish: null, observations: 1,
      next: { observations: 3, finish: 'holographic' }, validPhotos: 1,
      achievements: [{ kind: 'milestone', species: 10 }], registered: 10, total: 12,
      feathers: 1, covered: null, packProgress: 1, packReady: false,
    });
  });

  it('con la IA caída, el sticker y sus logros entran, pero el contador espera', () => {
    const result = evaluateValidatedPhoto({ species: catalog[0]!, catalog, stickers: [], ...photo(9), roll: 0, verified: false });
    expect(result).toMatchObject({ completed: true, counted: false, blocked: 'review', unlocked: null });
    expect(result.achievements.map(achievementId)).toEqual(['first-bird']);
  });
});

describe('evaluateRevalidatedPhoto', () => {
  const pending = sticker('ave0', { validPhotos: 1, observations: 0, countedDays: [] });

  it('al aprobarse después, cuenta y puede dar la suerte de la primera', () => {
    const result = evaluateRevalidatedPhoto({ sticker: pending, species: catalog[0]!, wallet: EMPTY_WALLET, takenAt: at(9), at: at(9), roll: 0 });
    expect(result).toMatchObject({ counted: true, unlocked: { finish: 'holographic', source: 'luck' } });
    expect(result.sticker).toMatchObject({ observations: 1, validPhotos: 1 });
  });

  it('no cuenta si entre tanto ya contó otra foto de ese día', () => {
    const counted = sticker('ave0', { observations: 1, countedDays: [limaDay(at(9))] });
    const result = evaluateRevalidatedPhoto({ sticker: counted, species: catalog[0]!, wallet: EMPTY_WALLET, takenAt: at(9), at: at(10), roll: 0 });
    expect(result).toMatchObject({ counted: false, blocked: 'today' });
    expect(result.reward.feathers).toBe(0);
  });

  it('la recompensa que esperó llega al aprobarse', () => {
    const wallet = { ...EMPTY_WALLET, feathers: 2, packSpecies: ['ave1', 'ave2'] };
    const { reward } = evaluateRevalidatedPhoto({ sticker: pending, species: catalog[0]!, wallet, takenAt: at(9), at: at(9), roll: 0.5 });
    expect(reward.feathers).toBe(1);
    expect(reward.wallet.feathers).toBe(3);
    expect(reward.pack).toEqual(['ave1', 'ave2', 'ave0']);
  });
});

describe('el premio de una foto', () => {
  it('una observación da 1 pluma y avanza el sobre', () => {
    const result = evaluateValidatedPhoto({ species: catalog[0]!, catalog, stickers: [], ...photo(3) });
    expect(result.reward.wallet).toEqual({ ...EMPTY_WALLET, feathers: 1, packSpecies: ['ave0'] });
    expect(sightingResultOf(result)).toMatchObject({ feathers: 1, covered: null, packProgress: 1, packReady: false });
  });

  it('la tercera observación llena el sobre y el contador vuelve a cero', () => {
    const wallet = { ...EMPTY_WALLET, packSpecies: ['ave1', 'ave2'] };
    const result = evaluateValidatedPhoto({ species: catalog[0]!, catalog, stickers: [], ...photo(3), wallet });
    expect(result.reward.pack).toEqual(['ave1', 'ave2', 'ave0']);
    expect(sightingResultOf(result)).toMatchObject({ packProgress: 0, packReady: true });
  });

  it('una segunda foto el mismo día entra en la galería y no paga nada', () => {
    const stickers = [sticker('ave0', { countedDays: [limaDay(at(3))] })];
    const result = evaluateValidatedPhoto({ species: catalog[0]!, catalog, stickers, ...photo(3), wallet: { ...EMPTY_WALLET, feathers: 4 } });
    expect(result).toMatchObject({ counted: false, blocked: 'today' });
    expect(result.reward).toEqual({ wallet: { ...EMPTY_WALLET, feathers: 4 }, feathers: 0, covered: null, pack: null });
  });

  it('con Gemini caído la foto entra y la recompensa espera', () => {
    const result = evaluateValidatedPhoto({ species: catalog[0]!, catalog, stickers: [], ...photo(3), verified: false });
    expect(result.counted).toBe(false);
    expect(result.reward.feathers).toBe(0);
    expect(result.reward.wallet.packSpecies).toEqual([]);
  });

  it('el hito ya cubierto por suerte paga sus plumas y no crea copia', () => {
    const covered = sticker('ave0', {
      observations: 2, best: 'holographic', ownBest: 'holographic', countedDays: [limaDay(at(4))], unlocked: [{ finish: 'holographic', source: 'luck', at: at(1) }],
    });
    const result = evaluateValidatedPhoto({ species: catalog[0]!, catalog, stickers: [covered], ...photo(5) });
    expect(result.unlocked).toBeNull();
    expect(result.sticker.unlocked).toHaveLength(1);
    expect(result.reward.covered).toEqual({ finish: 'holographic', source: 'luck', feathers: 3 });
    expect(result.reward.feathers).toBe(4);
  });

  it('solo las aves del álbum dan premio', () => {
    const mammal = species('zorro', { taxonClass: 'mammal' });
    const result = evaluateValidatedPhoto({ species: mammal, catalog: [...catalog, mammal], stickers: [], ...photo(3) });
    expect(result.counted).toBe(true);
    expect(result.reward.feathers).toBe(0);
  });
});
