import { describe, expect, it } from 'vitest';

import type { Sticker } from '../../domain/sticker';
import { species, sticker } from '../../testing';
import type { SpeciesCatalog } from '../ports/species-catalog';
import type { StickerRepository } from '../ports/sticker-repository';
import { makeGetAlbumSummary } from './get-album-summary';

// Dobles de los puertos: el caso de uso no sabe si detrás hay Firestore o memoria.
const catalog: SpeciesCatalog = {
  listByRegion: async (regionId) => (regionId === 'ica' ? [species('playero'), species('flamenco', { habitat: 'wetlands' })] : []),
};
const stickersOf = (byUser: Record<string, Sticker[]>): StickerRepository => ({ listByUser: async (userId) => byUser[userId] ?? [] });

describe('getAlbumSummary', () => {
  it('resume el álbum del usuario en la región pedida', async () => {
    const getAlbumSummary = makeGetAlbumSummary({ catalog, stickers: stickersOf({ ana: [sticker('playero')], otro: [sticker('flamenco')] }) });
    const summary = await getAlbumSummary({ userId: 'ana', regionId: 'ica' });
    expect(summary.registered).toBe(1);
    expect(summary.total).toBe(2);
  });

  it('en una región sin catálogo no cuenta nada', async () => {
    const getAlbumSummary = makeGetAlbumSummary({ catalog, stickers: stickersOf({ ana: [sticker('playero')] }) });
    expect(await getAlbumSummary({ userId: 'ana', regionId: 'lima' })).toMatchObject({ registered: 0, total: 0 });
  });
});
