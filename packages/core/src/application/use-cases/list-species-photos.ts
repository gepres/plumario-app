import type { SightingStatus, UserId } from '../../domain/sighting';
import type { SpeciesId } from '../../domain/species';
import type { PhotoStorage } from '../ports/photo-storage';
import type { SightingQueue } from '../ports/sighting-queue';
import type { SightingRepository } from '../ports/sighting-repository';

export type SpeciesPhoto = {
  sightingId: string;
  url: string;
  takenAt: Date;
  status: SightingStatus;
  placeName: string | null;
  /** Todavía en el teléfono, esperando señal para subirse («En espera»). */
  waiting: boolean;
};

/**
 * «Tu galería» (GaleriaEspecie): las fotos de una especie, de la más reciente a la más antigua. Las
 * que esperan señal van primero, con la copia del teléfono.
 */
export function makeListSpeciesPhotos(deps: { sightings: SightingRepository; photos: PhotoStorage; queue: SightingQueue }) {
  return async (userId: UserId, speciesId: SpeciesId): Promise<SpeciesPhoto[]> => {
    const waiting: SpeciesPhoto[] = (await deps.queue.list(userId))
      .filter((q) => q.speciesId === speciesId)
      .reverse()
      .map((q) => ({ sightingId: q.id, url: q.photoUri, takenAt: q.takenAt, status: 'pending', placeName: q.placeName, waiting: true }));
    // Sin señal no se pueden leer las subidas: si hay fotos en espera, se muestran esas.
    const sightings = await deps.sightings.listBySpecies(userId, speciesId).catch((error: unknown) => {
      if (waiting.length) return [];
      throw error;
    });
    const withPhoto = sightings.filter((s) => s.photoPath);
    // Si una foto ya no se puede leer (se borró), se omite en vez de romper la galería.
    const photos = await Promise.all(
      withPhoto.map(async (s) => {
        const url = await deps.photos.urlFor(s.photoPath!).catch(() => null);
        return url ? { sightingId: s.id, url, takenAt: s.takenAt, status: s.status, placeName: s.placeName, waiting: false } : null;
      }),
    );
    return [...waiting, ...photos.filter((p): p is SpeciesPhoto => p !== null)];
  };
}

/**
 * «Usar mis fotos» (PosterVista): de cada especie, la foto validada más reciente. Las que no tengan
 * (o no se puedan leer) quedan fuera y el póster las dibuja con su figura.
 */
export function makeListCoverPhotos(deps: { sightings: SightingRepository; photos: PhotoStorage }) {
  return async (userId: UserId, speciesIds: readonly SpeciesId[]): Promise<Record<SpeciesId, string>> => {
    const covers = await Promise.all(
      speciesIds.map(async (speciesId) => {
        const sightings = await deps.sightings.listBySpecies(userId, speciesId).catch(() => []);
        const cover = sightings.find((s) => s.status === 'validated' && s.photoPath);
        const url = cover ? await deps.photos.urlFor(cover.photoPath!).catch(() => null) : null;
        return url ? ([speciesId, url] as const) : null;
      }),
    );
    return Object.fromEntries(covers.filter((c) => c !== null));
  };
}
