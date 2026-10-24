import { describe, expect, it } from 'vitest';

import type { Sighting } from '../../domain/sighting';
import type { Species } from '../../domain/species';
import type { SightingRepository } from '../ports/sighting-repository';
import type { SpeciesCatalog } from '../ports/species-catalog';
import { makeGetAlbumSummary } from './get-album-summary';

// Dobles de los puertos: el caso de uso no sabe si detrás hay Firestore o memoria.
const catalog: SpeciesCatalog = {
  listByRegion: async (regionId) =>
    regionId === 'ica'
      ? ([
          { id: 'playero', regionId: 'ica', number: 11, commonName: 'Playero Arenero', scientificName: 'Calidris alba', habitat: 'coast', threatened: false },
          { id: 'flamenco', regionId: 'ica', number: 50, commonName: 'Flamenco Chileno', scientificName: 'Phoenicopterus chilensis', habitat: 'wetlands', threatened: false },
        ] satisfies Species[])
      : [],
};

const sightingsOf = (list: Sighting[]): SightingRepository => ({ listByUser: async (userId) => list.filter((s) => s.userId === userId) });
const at = new Date(2026, 9, 24);

describe('getAlbumSummary', () => {
  it('resume el álbum del usuario en la región pedida', async () => {
    const getAlbumSummary = makeGetAlbumSummary({
      catalog,
      sightings: sightingsOf([
        { id: '1', userId: 'ana', speciesId: 'playero', regionId: 'ica', takenAt: at },
        { id: '2', userId: 'otro', speciesId: 'flamenco', regionId: 'ica', takenAt: at },
      ]),
    });
    const summary = await getAlbumSummary({ userId: 'ana', regionId: 'ica' });
    expect(summary.registered).toBe(1);
    expect(summary.total).toBe(2);
  });

  it('no mezcla registros de otra región', async () => {
    const getAlbumSummary = makeGetAlbumSummary({
      catalog,
      sightings: sightingsOf([{ id: '1', userId: 'ana', speciesId: 'playero', regionId: 'lima', takenAt: at }]),
    });
    expect((await getAlbumSummary({ userId: 'ana', regionId: 'ica' })).registered).toBe(0);
  });
});
