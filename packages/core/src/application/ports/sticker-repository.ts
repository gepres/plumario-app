import type { UserId } from '../../domain/sighting';
import type { Sticker } from '../../domain/sticker';

/** Puerto de salida: los stickers del usuario. Solo los escribe el servidor (Cloud Functions). */
export interface StickerRepository {
  listByUser(userId: UserId): Promise<readonly Sticker[]>;
}
