import { describe, expect, it } from 'vitest';

import type { Sighting } from '../../domain/sighting';
import type { PhotoStorage } from '../ports/photo-storage';
import type { SightingRepository } from '../ports/sighting-repository';
import { makeListCoverPhotos } from './list-species-photos';

const sighting = (id: string, speciesId: string, status: Sighting['status'], photoPath: string | null): Sighting => ({
  id,
  userId: 'u1',
  speciesId,
  regionId: 'ica',
  takenAt: new Date(2026, 9, 1),
  status,
  photoPath,
  location: null,
  placeName: null,
  createdAt: new Date(2026, 9, 1),
  result: null,
});

describe('fotos para el póster de hábitat', () => {
  // Del más reciente al más antiguo, como los devuelve el repositorio.
  const bySpecies: Record<string, Sighting[]> = {
    parina: [sighting('s3', 'parina', 'pending', 'p/s3.jpg'), sighting('s2', 'parina', 'validated', 'p/s2.jpg'), sighting('s1', 'parina', 'validated', 'p/s1.jpg')],
    garza: [sighting('s4', 'garza', 'rejected', 'p/s4.jpg')],
    zarcillo: [sighting('s5', 'zarcillo', 'validated', 'p/borrada.jpg')],
  };
  const sightings = { listBySpecies: async (_u: string, id: string) => bySpecies[id] ?? [] } as unknown as SightingRepository;
  const photos: PhotoStorage = {
    upload: async () => '',
    urlFor: async (path) => {
      if (path.includes('borrada')) throw new Error('no existe');
      return `https://fotos/${path}`;
    },
  };
  const listCovers = makeListCoverPhotos({ sightings, photos });

  it('usa la foto validada más reciente de cada especie', async () => {
    await expect(listCovers('u1', ['parina'])).resolves.toEqual({ parina: 'https://fotos/p/s2.jpg' });
  });

  it('deja fuera las especies sin foto validada o con la foto borrada', async () => {
    await expect(listCovers('u1', ['garza', 'zarcillo', 'cóndor'])).resolves.toEqual({});
  });
});
