import { describe, expect, it } from 'vitest';

import { nextPoster, summarizeAlbum } from './album';
import type { Habitat } from './habitat';
import type { Sighting } from './sighting';
import type { Species } from './species';

const species = (id: string, habitat: Habitat): Species => ({
  id, regionId: 'ica', number: 0, commonName: id, scientificName: id, habitat, threatened: false,
});
const sighting = (speciesId: string, regionId = 'ica'): Sighting => ({
  id: `${speciesId}-${Math.random()}`, userId: 'u1', speciesId, regionId, takenAt: new Date(2026, 9, 24),
});

describe('nextPoster', () => {
  it('con 12 especies falta 8 para el póster 2, como en el diseño', () => {
    expect(nextPoster(12, 289)).toEqual({ number: 2, remaining: 8 });
  });

  it('al completar un póster, el siguiente pide 10 más', () => {
    expect(nextPoster(20, 289)).toEqual({ number: 3, remaining: 10 });
  });

  it('sin registros, el primer póster pide 10', () => {
    expect(nextPoster(0, 289)).toEqual({ number: 1, remaining: 10 });
  });

  it('no hay siguiente póster si el catálogo no alcanza', () => {
    expect(nextPoster(282, 289)).toBeNull();
  });
});

describe('summarizeAlbum', () => {
  const catalog = [species('a', 'coast'), species('b', 'coast'), species('c', 'wetlands'), species('d', 'highlands')];

  it('cuenta especies distintas, no fotos', () => {
    const summary = summarizeAlbum(catalog, [sighting('a'), sighting('a'), sighting('c')]);
    expect(summary.registered).toBe(2);
    expect(summary.total).toBe(4);
  });

  it('desglosa el avance por hábitat en el orden del diseño', () => {
    const summary = summarizeAlbum(catalog, [sighting('a'), sighting('c')]);
    expect(summary.byHabitat).toEqual([
      { habitat: 'coast', registered: 1, total: 2 },
      { habitat: 'wetlands', registered: 1, total: 1 },
      { habitat: 'desert', registered: 0, total: 0 },
      { habitat: 'highlands', registered: 0, total: 1 },
      { habitat: 'openSea', registered: 0, total: 0 },
    ]);
  });

  it('ignora registros de especies que no están en el catálogo', () => {
    expect(summarizeAlbum(catalog, [sighting('zzz')]).registered).toBe(0);
  });
});
