import { describe, expect, it } from 'vitest';

import { achievementId } from './achievements';
import { buildAlbumView } from './album-view';
import { chromesView, rewardsView } from './rewards';
import { at, species, sticker } from '../testing';

const catalog = [
  ...Array.from({ length: 24 }, (_, i) => species(`l${i}`, { albumNumber: i + 1 })),
  species('w0', { albumNumber: 30, habitat: 'wetlands' }),
  species('w1', { albumNumber: 31, habitat: 'wetlands', iucn: 'VU', threatened: true }),
  species('w2', { albumNumber: 32, habitat: 'wetlands', emblematic: true }),
];

describe('medallas', () => {
  const stickers = Array.from({ length: 12 }, (_, i) => sticker(`l${i}`, { completedAt: at(i + 1) }));
  const view = rewardsView(buildAlbumView(catalog, stickers), [
    { achievement: { kind: 'firstBird' }, earnedAt: at(1) },
    { achievement: { kind: 'milestone', species: 10 }, earnedAt: at(10) },
  ]);

  it('obtenidas según el álbum, con la fecha guardada y la más reciente primero', () => {
    expect(view.earned.map((e) => achievementId(e.achievement))).toEqual(['milestone-10', 'first-bird', 'explorer']);
    // El explorador se cumple aunque su registro aún no llegó: va sin fecha, al final.
    expect(view.earned[2]?.earnedAt).toBeNull();
  });

  it('la más cercana es la siguiente medalla de 10', () => {
    expect(view.closest).toEqual({ achievement: { kind: 'milestone', species: 20 }, current: 12, goal: 20 });
  });

  it('cada hábitat sin completar y el álbum entero', () => {
    expect(view.habitats.map((h) => [h.habitat, h.current, h.goal])).toEqual([['coast', 12, 24], ['wetlands', 0, 3]]);
    expect(view.album).toMatchObject({ current: 12, goal: 27 });
  });

  it('sin aves, la más cercana es la primera', () => {
    expect(rewardsView(buildAlbumView(catalog, []), []).closest).toMatchObject({ achievement: { kind: 'firstBird' }, current: 0, goal: 1 });
  });
});

describe('cromos', () => {
  const album = buildAlbumView(catalog, [
    sticker('l0', { chrome: { source: 'luck', at: at(2) } }),
    sticker('w1', { chrome: { source: 'photos', at: at(5) } }),
    sticker('l1', { validPhotos: 2 }),
    sticker('w2', { validPhotos: 4 }),
    sticker('l2', { validPhotos: 1 }),
  ]);
  const view = chromesView(album);

  it('cuenta por categoría lo registrado y lo cromado', () => {
    expect(view.categories.find((c) => c.category === 'holographic')).toEqual({ category: 'holographic', total: 25, registered: 3, chromed: 1 });
    expect(view.categories.find((c) => c.category === 'diamond')).toEqual({ category: 'diamond', total: 1, registered: 1, chromed: 1 });
  });

  it('obtenidos del más reciente, el más cerca de salir y el resto para intercambiar', () => {
    expect(view.chromed.map((e) => e.species.id)).toEqual(['w1', 'l0']);
    expect(view.closest?.species.id).toBe('w2');
    expect(view.toTrade.map((e) => e.species.id)).toEqual(['l1', 'l2']);
    expect(view.withoutChrome).toBe(3);
  });
});
