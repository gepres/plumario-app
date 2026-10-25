import type { Achievement } from '../../domain/achievements';
import type { UserId } from '../../domain/sighting';

/** Un logro que ya ganó el usuario, con cuándo y si ya vio su celebración. */
export type EarnedAchievement = { id: string; achievement: Achievement; earnedAt: Date; seen: boolean };

/** Puerto de salida: los logros del usuario. Los otorga el servidor; la app solo marca que los vio. */
export interface AchievementRepository {
  listByUser(userId: UserId): Promise<readonly EarnedAchievement[]>;
  /** Avisa cada vez que cambian los logros sin celebrar; devuelve la función para dejar de escuchar. */
  watchUnseen(userId: UserId, listener: (achievements: readonly EarnedAchievement[]) => void): () => void;
  markSeen(userId: UserId, achievementId: string): Promise<void>;
}
