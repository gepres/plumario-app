import { summarizeAlbum, type AlbumSummary } from '../../domain/album';
import type { UserId } from '../../domain/sighting';
import type { RegionId } from '../../domain/species';
import type { SpeciesCatalog } from '../ports/species-catalog';
import type { StickerRepository } from '../ports/sticker-repository';

export type GetAlbumSummary = (input: { userId: UserId; regionId: RegionId }) => Promise<AlbumSummary>;

/** Caso de uso: el avance del álbum de un usuario en una región (hero de Inicio, Recompensas). */
export function makeGetAlbumSummary(deps: { catalog: SpeciesCatalog; stickers: StickerRepository }): GetAlbumSummary {
  return async ({ userId, regionId }) => {
    const [species, stickers] = await Promise.all([deps.catalog.listByRegion(regionId), deps.stickers.listByUser(userId)]);
    return summarizeAlbum(species, stickers);
  };
}
