import { buildAlbumView, type AlbumView } from '../../domain/album-view';
import type { UserId } from '../../domain/sighting';
import type { RegionId } from '../../domain/species';
import type { SpeciesCatalog } from '../ports/species-catalog';
import type { StickerRepository } from '../ports/sticker-repository';

export type GetAlbum = (input: { userId: UserId; regionId: RegionId }) => Promise<AlbumView>;

/** Caso de uso: el álbum completo de un usuario en una región (Álbum, hábitats, galería). */
export function makeGetAlbum(deps: { catalog: SpeciesCatalog; stickers: StickerRepository }): GetAlbum {
  return async ({ userId, regionId }) => {
    const [species, stickers] = await Promise.all([deps.catalog.listByRegion(regionId), deps.stickers.listByUser(userId)]);
    return buildAlbumView(species, stickers);
  };
}
