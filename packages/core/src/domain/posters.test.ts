import { describe, expect, it } from 'vitest';

import { buildAlbumView } from './album-view';
import { posterSpecies, postersView, type SavedPoster } from './posters';
import { at, species as aSpecies, sticker as aSticker } from '../testing';

import { isHabitatPosterUnlocked, pickPosterSpecies, speciesPostersAvailable } from './posters';

const registered = Array.from({ length: 23 }, (_, i) => `especie-${i}`);

describe('pósteres cada 10 especies', () => {
  it('hay un póster por cada 10 especies', () => {
    expect(speciesPostersAvailable(9)).toBe(0);
    expect(speciesPostersAvailable(12)).toBe(1);
    expect(speciesPostersAvailable(23)).toBe(2);
  });

  it('elige 10 especies distintas de las registradas', () => {
    const picked = pickPosterSpecies(registered, 42);
    expect(picked).toHaveLength(10);
    expect(new Set(picked).size).toBe(10);
    expect(picked.every((id) => registered.includes(id))).toBe(true);
  });

  it('la misma semilla da el mismo póster; «Mezclar» cambia la semilla y la mezcla', () => {
    expect(pickPosterSpecies(registered, 42)).toEqual(pickPosterSpecies([...registered].reverse(), 42));
    expect(pickPosterSpecies(registered, 43)).not.toEqual(pickPosterSpecies(registered, 42));
  });

  it('con menos de 10 especies usa las que hay', () => {
    expect(pickPosterSpecies(registered.slice(0, 4), 1)).toHaveLength(4);
  });
});

describe('póster por hábitat', () => {
  it('se descarga al completar todas las especies del hábitat', () => {
    expect(isHabitatPosterUnlocked({ habitat: 'coast', registered: 8, total: 43 })).toBe(false);
    expect(isHabitatPosterUnlocked({ habitat: 'coast', registered: 43, total: 43 })).toBe(true);
    expect(isHabitatPosterUnlocked({ habitat: 'desert', registered: 0, total: 0 })).toBe(false);
  });
});

describe('qué especies entran a cada póster', () => {
  const habitats = ['coast', 'wetlands', 'desert'] as const;
  const catalog = Array.from({ length: 30 }, (_, i) => aSpecies(`s${i}`, { albumNumber: i + 1, habitat: habitats[i % 3] }));
  // Registradas en orden: s0 el día 1, s1 el día 2…
  const album = buildAlbumView(catalog, catalog.slice(0, 24).map((sp, i) => aSticker(sp.id, { completedAt: at(i + 1) })));

  it('el póster 1 lleva las 10 primeras; mezclar solo cambia el orden', () => {
    const first = posterSpecies(album.entries, 1, 7);
    expect([...first].sort()).toEqual(catalog.slice(0, 10).map((sp) => sp.id).sort());
    expect(posterSpecies(album.entries, 1, 8)).not.toEqual(first);
    expect([...posterSpecies(album.entries, 1, 8)].sort()).toEqual([...first].sort());
  });

  it('desde el 2: 10 distintas entre todas, con al menos una de cada hábitat', () => {
    const second = posterSpecies(album.entries, 2, 7);
    expect(new Set(second).size).toBe(10);
    const habitatOf = (id: string) => catalog.find((sp) => sp.id === id)!.habitat;
    expect(new Set(second.map(habitatOf))).toEqual(new Set(habitats));
    expect(posterSpecies(album.entries, 2, 7)).toEqual(second);
  });
});

describe('la pestaña Pósteres', () => {
  const catalog = Array.from({ length: 40 }, (_, i) => aSpecies(`s${i}`, { albumNumber: i + 1, habitat: i < 30 ? 'coast' : 'wetlands' }));
  const album = buildAlbumView(catalog, [...catalog.slice(0, 22), ...catalog.slice(30)].map((sp) => aSticker(sp.id)));
  const saved: SavedPoster = { id: 'p1', kind: 'species', number: 1, habitat: null, speciesIds: [], seed: 7, theme: 'light', title: 'Mis aves', savedAt: at(3) };

  it('los de cada 10: guardado, listo para armar y el próximo', () => {
    const view = postersView(album, [saved]);
    expect(view.species.map((s) => s.status)).toEqual(['saved', 'ready', 'ready', 'next']);
    expect(view.species[3]).toEqual({ status: 'next', number: 4, registered: 32, goal: 40 });
  });

  it('uno por hábitat, que se habilita al completarlo', () => {
    const view = postersView(album, []);
    expect(view.habitats.map((h) => [h.habitat, h.registered, h.total, h.unlocked])).toEqual([['coast', 22, 30, false], ['wetlands', 10, 10, true]]);
  });
});
