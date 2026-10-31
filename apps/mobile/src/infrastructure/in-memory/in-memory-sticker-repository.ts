import { limaDay, newSticker, type Sticker, type StickerRepository, type UserId } from '@plumario/core';

/** Lo que ya tiene la cuenta de muestra, para ver en la web los tres estados del sticker. */
export const SAMPLE_STICKERS: readonly Sticker[] = [
  { ...newSticker('calidris-alba', new Date(2026, 9, 23)), validPhotos: 1, observations: 1, countedDays: [limaDay(new Date(2026, 9, 23))], best: 'holographic', ownBest: 'holographic', unlocked: [{ finish: 'holographic', source: 'luck', at: new Date(2026, 9, 23) }] },
  { ...newSticker('larus-belcheri', new Date(2026, 9, 12)), validPhotos: 2, observations: 2, countedDays: [limaDay(new Date(2026, 9, 13))] },
  {
    ...newSticker('sternula-lorata', new Date(2026, 9, 18)), validPhotos: 5, observations: 5, countedDays: [limaDay(new Date(2026, 9, 20))], best: 'silver', ownBest: 'silver', claimedMilestone: 5,
    unlocked: [{ finish: 'holographic', source: 'milestone', at: new Date(2026, 9, 19) }, { finish: 'silver', source: 'milestone', at: new Date(2026, 9, 20) }],
  },
  { ...newSticker('phoenicopterus-chilensis', new Date(2026, 9, 21)), validPhotos: 4, observations: 2, countedDays: [limaDay(new Date(2026, 9, 22))] },
];

/**
 * Adaptador en memoria del puerto StickerRepository, para la vista web. En Firebase los stickers
 * salen de Firestore y los escribe el servidor al validar cada foto.
 */
export class InMemoryStickerRepository implements StickerRepository {
  private readonly byUser = new Map<UserId, Sticker[]>();

  constructor(initial: Record<UserId, readonly Sticker[]> = {}) {
    for (const [userId, stickers] of Object.entries(initial)) this.byUser.set(userId, [...stickers]);
  }

  async listByUser(userId: UserId): Promise<readonly Sticker[]> {
    return this.byUser.get(userId) ?? [];
  }

  /** Lo que en Firebase escribe el servidor; acá lo usa el registro en memoria al validar. */
  save(userId: UserId, sticker: Sticker): void {
    const others = (this.byUser.get(userId) ?? []).filter((s) => s.speciesId !== sticker.speciesId);
    this.byUser.set(userId, [...others, sticker]);
  }
}
