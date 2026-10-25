import type { AlbumEntry, AlbumView } from '../../domain/album-view';
import { PLACE_NAME_MAX, type Sighting, type UserId } from '../../domain/sighting';
import type { RegionId, Species } from '../../domain/species';
import type { PhotoStorage } from '../ports/photo-storage';
import { NetworkError, type SightingQueue } from '../ports/sighting-queue';
import type { SightingRepository } from '../ports/sighting-repository';
import type { SpeciesIdentifier } from '../ports/species-identifier';

// Casos de uso de Registrar (design/project/FlujoRegistrar.dc.html): la IA sugiere especies para
// una foto, revisa que la foto sea de la elegida, y el registro se guarda para que el servidor lo
// valide y otorgue sticker, cromo y logros.

export type Suggestion = { entry: AlbumEntry; confidence: number };

/** «La IA sugiere 3 especies, como stickers»: entre las especies del álbum de la región. */
export function makeSuggestSpecies({ identifier }: { identifier: SpeciesIdentifier }) {
  return async (photoUri: string, album: AlbumView, limit = 3): Promise<Suggestion[]> => {
    const suggestions = await identifier.suggest(photoUri, album.entries.map((e) => e.species), limit);
    const byId = new Map(album.entries.map((e) => [e.species.id, e]));
    return suggestions.flatMap(({ speciesId, confidence }) => {
      const entry = byId.get(speciesId);
      return entry ? [{ entry, confidence }] : [];
    });
  };
}

/** «La IA confirma: Gaviota Dominicana», o pide otra foto antes de guardar. */
export function makeCheckPhoto({ identifier }: { identifier: SpeciesIdentifier }) {
  return (photoUri: string, species: Species) => identifier.validate(photoUri, species);
}

export type RegisterSightingInput = {
  userId: UserId;
  regionId: RegionId;
  species: Species;
  photoUri: string;
  takenAt: Date;
  placeName: string;
  /** Dónde se tomó, si la foto lo trae (EXIF). */
  location: { latitude: number; longitude: number } | null;
  /** PerfilPrivacidad, «Guardar la ubicación». */
  saveLocation: boolean;
};

export type RegisterResult =
  /** Subido: se sigue hasta que el servidor lo valide. */
  | { kind: 'sent'; sightingId: string }
  /** Sin señal: quedó en el teléfono y se sube solo al volver la conexión. */
  | { kind: 'queued'; queuedId: string };

type Deps = { photos: PhotoStorage; sightings: SightingRepository; queue: SightingQueue; now: () => Date };

/** Lo que se guarda del registro: la ubicación y el lugar, según la privacidad y la especie. */
function privateFields(input: RegisterSightingInput) {
  const place = input.placeName.trim().slice(0, PLACE_NAME_MAX);
  return {
    location: input.saveLocation && !input.species.threatened ? input.location : null,
    placeName: input.species.threatened || !place ? null : place,
  };
}

/** Sube la foto y crea el registro pendiente; el servidor lo valida (onSightingCreated). */
async function send(deps: Deps, item: { userId: UserId; regionId: RegionId; speciesId: string; photoUri: string; takenAt: Date; placeName: string | null; location: Sighting['location'] }) {
  const id = deps.sightings.newId(item.userId);
  const photoPath = await deps.photos.upload(item.userId, item.photoUri, `${id}.jpg`);
  await deps.sightings.add({
    id,
    userId: item.userId,
    speciesId: item.speciesId,
    regionId: item.regionId,
    takenAt: item.takenAt,
    status: 'pending',
    photoPath,
    location: item.location,
    placeName: item.placeName,
    createdAt: deps.now(),
    result: null,
  });
  return id;
}

/**
 * Sube la foto y guarda el registro pendiente para que el servidor lo valide. Sin señal, lo deja en
 * la cola del teléfono. La ubicación se guarda solo si la persona lo permite, y en especies
 * amenazadas no se guardan ni la ubicación ni el lugar, ni aunque se haya escrito.
 */
export function makeRegisterSighting(deps: Deps) {
  return async (input: RegisterSightingInput): Promise<RegisterResult> => {
    const item = { userId: input.userId, regionId: input.regionId, speciesId: input.species.id, photoUri: input.photoUri, takenAt: input.takenAt, ...privateFields(input) };
    try {
      return { kind: 'sent', sightingId: await send(deps, item) };
    } catch (error) {
      if (!(error instanceof NetworkError)) throw error;
      const queued = await deps.queue.enqueue({ ...item, queuedAt: deps.now() });
      return { kind: 'queued', queuedId: queued.id };
    }
  };
}

/**
 * «Al volver la señal»: sube los registros de la cola, del más viejo al más nuevo. Si se corta otra
 * vez, para y deja el resto para el próximo intento. Devuelve los ids de los que se subieron.
 */
export function makeSendQueuedSightings(deps: Deps) {
  return async (userId: UserId): Promise<string[]> => {
    const sent: string[] = [];
    for (const item of await deps.queue.list(userId)) {
      try {
        sent.push(await send(deps, item));
      } catch (error) {
        if (error instanceof NetworkError) break;
        throw error;
      }
      await deps.queue.remove(item.id);
    }
    return sent;
  };
}
