import { describe, expect, it } from 'vitest';

import { buildAlbumView } from '../../domain/album-view';
import type { Sighting } from '../../domain/sighting';
import { species, sticker } from '../../testing';
import type { PhotoStorage } from '../ports/photo-storage';
import { NetworkError, type QueuedSighting, type SightingQueue } from '../ports/sighting-queue';
import type { SightingRepository } from '../ports/sighting-repository';
import type { SpeciesIdentifier } from '../ports/species-identifier';
import { makeCheckPhoto, makeRegisterSighting, makeSendQueuedSightings, makeSuggestSpecies } from './register-sighting';

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
  // Se corta o vuelve la señal cambiando net.online.
  const net = { online: true };
  let nextId = 1;
  const photos: PhotoStorage = {
    upload: async (userId, uri, name) => {
      if (!net.online) throw new NetworkError();
      uploads.push(uri);
      return `users/${userId}/photos/${name}`;
    },
    urlFor: async (path) => path,
  };
  const queued: QueuedSighting[] = [];
  const queue: SightingQueue = {
    enqueue: async (item) => {
      const stored = { ...item, id: `q${queued.length + 1}`, photoUri: `file://cola/${queued.length + 1}.jpg` };
      queued.push(stored);
      return stored;
    },
    list: async (userId) => queued.filter((q) => q.userId === userId),
    remove: async (id) => void queued.splice(queued.findIndex((q) => q.id === id), 1),
  };
  const sightings: SightingRepository = {
    newId: () => `s${nextId++}`,
    add: async (s) => void saved.push(s),
    watch: () => () => {},
    listBySpecies: async () => [],
    listByUser: async () => [],
  };
  return { photos, sightings, queue, saved, uploads, queued, net };
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
    const { photos, sightings, queue, saved, uploads } = fakes();
    const result = await makeRegisterSighting({ photos, sightings, queue, now })({ ...input, species: gaviota });
    expect(result).toEqual({ kind: 'sent', sightingId: 's1' });
    expect(uploads).toEqual(['file://foto.jpg']);
    expect(saved[0]).toMatchObject({ id: 's1', speciesId: 'gaviota-dominicana', status: 'pending', photoPath: 'users/u1/photos/s1.jpg', placeName: 'Paracas', result: null, location: null });
  });

  it('en una especie amenazada no guarda el lugar', async () => {
    const { photos, sightings, queue, saved } = fakes();
    await makeRegisterSighting({ photos, sightings, queue, now })({ ...input, species: pinguino });
    expect(saved[0]?.placeName).toBeNull();
  });

  it('la ubicación se guarda solo si la persona lo permite, y nunca en una especie amenazada', async () => {
    const { photos, sightings, queue, saved } = fakes();
    const register = makeRegisterSighting({ photos, sightings, queue, now });
    await register({ ...input, species: gaviota, saveLocation: true });
    await register({ ...input, species: pinguino, saveLocation: true });
    expect(saved.map((s) => s.location)).toEqual([paracas, null]);
  });

  it('un lugar vacío queda en null', async () => {
    const { photos, sightings, queue, saved } = fakes();
    await makeRegisterSighting({ photos, sightings, queue, now })({ ...input, species: gaviota, placeName: '   ' });
    expect(saved[0]?.placeName).toBeNull();
  });
});

describe('registrar sin señal', () => {
  const now = () => new Date(2026, 9, 24, 10);
  const input = { userId: 'u1', regionId: 'ica', photoUri: 'file://tmp/foto.jpg', takenAt: new Date(2026, 9, 24, 8), placeName: 'Paracas', location: null, saveLocation: false };

  it('sin conexión, el registro queda en la cola con su copia de la foto y sin subir nada', async () => {
    const { photos, sightings, queue, saved, queued, net } = fakes();
    net.online = false;
    const result = await makeRegisterSighting({ photos, sightings, queue, now })({ ...input, species: gaviota });
    expect(result).toEqual({ kind: 'queued', queuedId: 'q1' });
    expect(saved).toHaveLength(0);
    expect(queued[0]).toMatchObject({ speciesId: 'gaviota-dominicana', placeName: 'Paracas', takenAt: input.takenAt, queuedAt: now() });
  });

  it('en la cola también se respetan las reglas de privacidad', async () => {
    const { photos, sightings, queue, queued, net } = fakes();
    net.online = false;
    await makeRegisterSighting({ photos, sightings, queue, now })({ ...input, species: pinguino, location: { latitude: -13.8, longitude: -76.2 }, saveLocation: true });
    expect(queued[0]).toMatchObject({ placeName: null, location: null });
  });

  it('al volver la señal se suben en orden, con la fecha de la foto, y salen de la cola', async () => {
    const { photos, sightings, queue, saved, queued, net } = fakes();
    const register = makeRegisterSighting({ photos, sightings, queue, now });
    net.online = false;
    await register({ ...input, species: gaviota });
    await register({ ...input, species: pinguino, placeName: '' });
    net.online = true;
    // Los intentos sin señal ya usaron s1 y s2: el registro se crea con un id nuevo al subirlo.
    await expect(makeSendQueuedSightings({ photos, sightings, queue, now })('u1')).resolves.toEqual(['s3', 's4']);
    expect(saved.map((x) => [x.speciesId, x.takenAt, x.photoPath])).toEqual([
      ['gaviota-dominicana', input.takenAt, 'users/u1/photos/s3.jpg'],
      ['pinguino', input.takenAt, 'users/u1/photos/s4.jpg'],
    ]);
    expect(queued).toHaveLength(0);
  });

  it('si se vuelve a cortar, deja el resto para la próxima', async () => {
    const { photos, sightings, queue, queued, net } = fakes();
    net.online = false;
    await makeRegisterSighting({ photos, sightings, queue, now })({ ...input, species: gaviota });
    await expect(makeSendQueuedSightings({ photos, sightings, queue, now })('u1')).resolves.toEqual([]);
    expect(queued).toHaveLength(1);
  });
});
