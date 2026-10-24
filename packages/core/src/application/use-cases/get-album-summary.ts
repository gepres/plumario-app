import { summarizeAlbum, type AlbumSummary } from '../../domain/album';
import type { UserId } from '../../domain/sighting';
import type { RegionId } from '../../domain/species';
import type { SightingRepository } from '../ports/sighting-repository';
import type { SpeciesCatalog } from '../ports/species-catalog';

export type GetAlbumSummary = (input: { userId: UserId; regionId: RegionId }) => Promise<AlbumSummary>;

/** Caso de uso: el avance del álbum de un usuario en una región (hero de Inicio, Recompensas). */
export function makeGetAlbumSummary(deps: { catalog: SpeciesCatalog; sightings: SightingRepository }): GetAlbumSummary {
  return async ({ userId, regionId }) => {
    const [species, sightings] = await Promise.all([
      deps.catalog.listByRegion(regionId),
      deps.sightings.listByUser(userId),
    ]);
    return summarizeAlbum(species, sightings.filter((s) => s.regionId === regionId));
  };
}
