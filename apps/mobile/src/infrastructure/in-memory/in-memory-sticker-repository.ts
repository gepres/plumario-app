import type { Sticker, StickerRepository, UserId } from '@plumario/core';

/** Lo que ya tiene la cuenta de muestra, para ver en la web los tres estados del sticker. */
export const SAMPLE_STICKERS: readonly Sticker[] = [
  { speciesId: 'playero-arenero', completedAt: new Date(2026, 9, 23), validPhotos: 1, chrome: { source: 'luck', at: new Date(2026, 9, 23) } },
  { speciesId: 'gaviota-peruana', completedAt: new Date(2026, 9, 12), validPhotos: 2, chrome: null },
  { speciesId: 'gaviotin-peruano', completedAt: new Date(2026, 9, 18), validPhotos: 5, chrome: { source: 'photos', at: new Date(2026, 9, 20) } },
  { speciesId: 'flamenco-chileno', completedAt: new Date(2026, 9, 21), validPhotos: 4, chrome: null },
];

/**
 * Adaptador en memoria del puerto StickerRepository: para la vista web y mientras no hay sesión.
 * Con sesión, los stickers salen de Firestore (los escribe el servidor al validar cada foto).
 */
export class InMemoryStickerRepository implements StickerRepository {
  private readonly byUser = new Map<UserId, Sticker[]>();

  constructor(initial: Record<UserId, readonly Sticker[]> = {}) {
    for (const [userId, stickers] of Object.entries(initial)) this.byUser.set(userId, [...stickers]);
  }

  async listByUser(userId: UserId): Promise<readonly Sticker[]> {
    return this.byUser.get(userId) ?? [];
  }
}
