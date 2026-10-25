import type { Sticker, StickerRepository, UserId } from '@plumario/core';

/**
 * Adaptador en memoria del puerto StickerRepository: para la vista web y mientras no hay sesión.
 * Con sesión, los stickers salen de Firestore (los escribe el servidor al validar cada foto).
 */
export class InMemoryStickerRepository implements StickerRepository {
  private readonly byUser = new Map<UserId, Sticker[]>();

  constructor(initial: Record<UserId, Sticker[]> = {}) {
    for (const [userId, stickers] of Object.entries(initial)) this.byUser.set(userId, [...stickers]);
  }

  async listByUser(userId: UserId): Promise<readonly Sticker[]> {
    return this.byUser.get(userId) ?? [];
  }
}
