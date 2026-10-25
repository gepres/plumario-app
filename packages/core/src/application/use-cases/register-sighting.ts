import type { AlbumEntry, AlbumView } from '../../domain/album-view';
import { PLACE_NAME_MAX, type Sighting, type UserId } from '../../domain/sighting';
import type { RegionId, Species } from '../../domain/species';
import type { PhotoStorage } from '../ports/photo-storage';
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

/**
 * Sube la foto y guarda el registro pendiente; devuelve su id para seguirlo hasta que el servidor lo
 * valide. La ubicación se guarda solo si la persona lo permite, y en especies amenazadas no se guardan
 * ni la ubicación ni el lugar, ni aunque se haya escrito.
 */
export function makeRegisterSighting(deps: { photos: PhotoStorage; sightings: SightingRepository; now: () => Date }) {
  return async (input: RegisterSightingInput): Promise<string> => {
    const id = deps.sightings.newId(input.userId);
    const photoPath = await deps.photos.upload(input.userId, input.photoUri, `${id}.jpg`);
    const place = input.placeName.trim().slice(0, PLACE_NAME_MAX);
    const sighting: Sighting = {
      id,
      userId: input.userId,
      speciesId: input.species.id,
      regionId: input.regionId,
      takenAt: input.takenAt,
      status: 'pending',
      photoPath,
      location: input.saveLocation && !input.species.threatened ? input.location : null,
      placeName: input.species.threatened || !place ? null : place,
      createdAt: deps.now(),
      result: null,
    };
    await deps.sightings.add(sighting);
    return id;
  };
}
