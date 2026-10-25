import { describe, expect, it } from 'vitest';

import { achievementId } from '../../domain/achievements';
import { at, species, sticker } from '../../testing';
import { evaluateValidatedPhoto, sightingResultOf } from './evaluate-validated-photo';

const catalog = Array.from({ length: 12 }, (_, i) => species(`ave${i}`));

describe('evaluateValidatedPhoto', () => {
  it('la primera foto de una especie completa el sticker y puede dar logros', () => {
    const result = evaluateValidatedPhoto({ species: catalog[0]!, catalog, stickers: [], at: at(3), roll: 0.5 });
    expect(result.completed).toBe(true);
    expect(result.category).toBe('holographic');
    expect(result.achievements.map(achievementId)).toEqual(['first-bird']);
  });

  it('la décima especie da la medalla de 10', () => {
    const nine = Array.from({ length: 9 }, (_, i) => sticker(`ave${i}`));
    const result = evaluateValidatedPhoto({ species: catalog[9]!, catalog, stickers: nine, at: at(4), roll: 0.5 });
    expect(result.achievements.map(achievementId)).toEqual(['milestone-10']);
  });

  it('una foto más de una especie ya registrada no da logros, pero suma para el cromo', () => {
    const result = evaluateValidatedPhoto({ species: catalog[0]!, catalog, stickers: [sticker('ave0', { validPhotos: 4 })], at: at(5), roll: 0.5 });
    expect(result.completed).toBe(false);
    expect(result.chromed).toBe('photos');
    expect(result.achievements).toEqual([]);
  });

  it('un mamífero tiene sticker y cromo, pero no cuenta para los logros del álbum de aves', () => {
    const lobo = species('lobo', { taxonClass: 'mammal' });
    const result = evaluateValidatedPhoto({ species: lobo, catalog: [...catalog, lobo], stickers: [], at: at(6), roll: 0.5 });
    expect(result.completed).toBe(true);
    expect(result.achievements).toEqual([]);
  });

  it('la categoría del cromo sale de la especie', () => {
    const condor = species('condor', { iucn: 'VU', habitat: 'highlands' });
    expect(evaluateValidatedPhoto({ species: condor, catalog: [...catalog, condor], stickers: [], at: at(7), roll: 0 }))
      .toMatchObject({ chromed: 'luck', category: 'diamond' });
  });

  it('deja en el registro lo que pasó y el avance del álbum', () => {
    const nine = Array.from({ length: 9 }, (_, i) => sticker(`ave${i}`));
    const result = evaluateValidatedPhoto({ species: catalog[9]!, catalog, stickers: nine, at: at(8), roll: 0.9 });
    expect(sightingResultOf(result)).toEqual({
      outcome: 'validated', completed: true, chromed: null, category: 'holographic', validPhotos: 1,
      achievements: [{ kind: 'milestone', species: 10 }], registered: 10, total: 12,
    });
  });
});
