import type { SightingStatus, UserId } from '../../domain/sighting';
import type { SpeciesId } from '../../domain/species';
import type { PhotoStorage } from '../ports/photo-storage';
import type { SightingRepository } from '../ports/sighting-repository';

export type SpeciesPhoto = {
  sightingId: string;
  url: string;
  takenAt: Date;
  status: SightingStatus;
  placeName: string | null;
};

/** «Tu galería» (GaleriaEspecie): las fotos de una especie, de la más reciente a la más antigua. */
export function makeListSpeciesPhotos(deps: { sightings: SightingRepository; photos: PhotoStorage }) {
  return async (userId: UserId, speciesId: SpeciesId): Promise<SpeciesPhoto[]> => {
    const sightings = await deps.sightings.listBySpecies(userId, speciesId);
    const withPhoto = sightings.filter((s) => s.photoPath);
    // Si una foto ya no se puede leer (se borró), se omite en vez de romper la galería.
    const photos = await Promise.all(
      withPhoto.map(async (s) => {
        const url = await deps.photos.urlFor(s.photoPath!).catch(() => null);
        return url ? { sightingId: s.id, url, takenAt: s.takenAt, status: s.status, placeName: s.placeName } : null;
      }),
    );
    return photos.filter((p): p is SpeciesPhoto => p !== null);
  };
}
