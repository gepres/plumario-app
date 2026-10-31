import { describe, expect, it } from 'vitest';

import { achievementId } from '../../domain/achievements';
import { at, species, sticker } from '../../testing';
import { evaluateRevalidatedPhoto, evaluateValidatedPhoto, sightingResultOf } from './evaluate-validated-photo';

const catalog = Array.from({ length: 12 }, (_, i) => species(`ave${i}`));
const photo = (day: number) => ({ takenAt: at(day), at: at(day), roll: 0.5, verified: true });

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
    const stickers = [sticker('ave0', { validPhotos: 2, observations: 2, lastCountedAt: at(4) })];
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
    });
  });

  it('con la IA caída, el sticker y sus logros entran, pero el contador espera', () => {
    const result = evaluateValidatedPhoto({ species: catalog[0]!, catalog, stickers: [], ...photo(9), roll: 0, verified: false });
    expect(result).toMatchObject({ completed: true, counted: false, blocked: 'review', unlocked: null });
    expect(result.achievements.map(achievementId)).toEqual(['first-bird']);
  });
});

describe('evaluateRevalidatedPhoto', () => {
  const pending = sticker('ave0', { validPhotos: 1, observations: 0, lastCountedAt: null });

  it('al aprobarse después, cuenta y puede dar la suerte de la primera', () => {
    const result = evaluateRevalidatedPhoto({ sticker: pending, species: catalog[0]!, takenAt: at(9), at: at(9), roll: 0 });
    expect(result).toMatchObject({ counted: true, unlocked: { finish: 'holographic', source: 'luck' } });
    expect(result.sticker).toMatchObject({ observations: 1, validPhotos: 1 });
  });

  it('no cuenta si entre tanto ya contó otra foto de ese día', () => {
    const counted = sticker('ave0', { observations: 1, lastCountedAt: at(9) });
    const result = evaluateRevalidatedPhoto({ sticker: counted, species: catalog[0]!, takenAt: at(9), at: at(10), roll: 0 });
    expect(result).toMatchObject({ counted: false, blocked: 'today' });
  });
});
