import { describe, expect, it } from 'vitest';

import { buildAlbumView } from '../../domain/album-view';
import type { Sighting } from '../../domain/sighting';
import { species, sticker } from '../../testing';
import type { PhotoStorage } from '../ports/photo-storage';
import type { SightingRepository } from '../ports/sighting-repository';
import type { SpeciesIdentifier } from '../ports/species-identifier';
import { makeCheckPhoto, makeRegisterSighting, makeSuggestSpecies } from './register-sighting';

const gaviota = species('gaviota-dominicana', { albumNumber: 23 });
const pinguino = species('pinguino', { albumNumber: 32, threatened: true, iucn: 'VU' });
const album = buildAlbumView([gaviota, pinguino, species('lobo', { taxonClass: 'mammal' })], [sticker('pinguino')]);

const identifier: SpeciesIdentifier = {
  suggest: async (_photo, candidates, limit) => [
    { speciesId: 'lobo', confidence: 0.9 },
    ...candidates.map((c, i) => ({ speciesId: c.id, confidence: 0.8 - i / 10 })),
  ].slice(0, limit + 1),
  validate: async (photo, s) => (photo.includes(s.id) ? { valid: true } : { valid: false, reason: 'otra especie' }),
};

function fakes() {
  const saved: Sighting[] = [];
  const uploads: string[] = [];
  const photos: PhotoStorage = {
    upload: async (userId, uri, name) => {
      uploads.push(uri);
      return `users/${userId}/photos/${name}`;
    },
    urlFor: async (path) => path,
  };
  const sightings: SightingRepository = {
    newId: () => 's1',
    add: async (s) => void saved.push(s),
    watch: () => () => {},
    listBySpecies: async () => [],
    listByUser: async () => [],
  };
  return { photos, sightings, saved, uploads };
}

describe('sugerencias', () => {
  it('son especies del álbum, con su sticker si ya la tiene', async () => {
    const suggestions = await makeSuggestSpecies({ identifier })('foto.jpg', album, 2);
    // El lobo marino no está en el álbum: se descarta.
    expect(suggestions.map((s) => s.entry.species.id)).toEqual(['gaviota-dominicana', 'pinguino']);
    expect(suggestions[1]?.entry.sticker?.speciesId).toBe('pinguino');
  });

  it('la IA revisa que la foto sea de la especie elegida', async () => {
    await expect(makeCheckPhoto({ identifier })('gaviota-dominicana.jpg', gaviota)).resolves.toEqual({ valid: true });
    await expect(makeCheckPhoto({ identifier })('otra.jpg', gaviota)).resolves.toMatchObject({ valid: false });
  });
});

describe('registrar', () => {
  const now = () => new Date(2026, 9, 24, 10);
  const paracas = { latitude: -13.84, longitude: -76.25 };
  const input = { userId: 'u1', regionId: 'ica', photoUri: 'file://foto.jpg', takenAt: new Date(2026, 9, 24, 8), placeName: '  Paracas  ', location: paracas, saveLocation: false };

  it('sube la foto con el id del registro y lo guarda pendiente', async () => {
    const { photos, sightings, saved, uploads } = fakes();
    const id = await makeRegisterSighting({ photos, sightings, now })({ ...input, species: gaviota });
    expect(id).toBe('s1');
    expect(uploads).toEqual(['file://foto.jpg']);
    expect(saved[0]).toMatchObject({ id: 's1', speciesId: 'gaviota-dominicana', status: 'pending', photoPath: 'users/u1/photos/s1.jpg', placeName: 'Paracas', result: null, location: null });
  });

  it('en una especie amenazada no guarda el lugar', async () => {
    const { photos, sightings, saved } = fakes();
    await makeRegisterSighting({ photos, sightings, now })({ ...input, species: pinguino });
    expect(saved[0]?.placeName).toBeNull();
  });

  it('la ubicación se guarda solo si la persona lo permite, y nunca en una especie amenazada', async () => {
    const { photos, sightings, saved } = fakes();
    const register = makeRegisterSighting({ photos, sightings, now });
    await register({ ...input, species: gaviota, saveLocation: true });
    await register({ ...input, species: pinguino, saveLocation: true });
    expect(saved.map((s) => s.location)).toEqual([paracas, null]);
  });

  it('un lugar vacío queda en null', async () => {
    const { photos, sightings, saved } = fakes();
    await makeRegisterSighting({ photos, sightings, now })({ ...input, species: gaviota, placeName: '   ' });
    expect(saved[0]?.placeName).toBeNull();
  });
});
