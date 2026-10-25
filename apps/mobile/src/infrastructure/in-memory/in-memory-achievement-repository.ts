import { achievementId, type Achievement, type AchievementRepository, type EarnedAchievement, type UserId } from '@plumario/core';

/** Adaptador en memoria del puerto AchievementRepository, para la vista web. */
export class InMemoryAchievementRepository implements AchievementRepository {
  private readonly byUser = new Map<UserId, EarnedAchievement[]>();
  private readonly listeners = new Map<UserId, Set<(list: readonly EarnedAchievement[]) => void>>();

  async listByUser(userId: UserId): Promise<readonly EarnedAchievement[]> {
    return this.byUser.get(userId) ?? [];
  }

  watchUnseen(userId: UserId, listener: (list: readonly EarnedAchievement[]) => void) {
    const set = this.listeners.get(userId) ?? new Set();
    set.add(listener);
    this.listeners.set(userId, set);
    listener(this.unseen(userId));
    return () => {
      set.delete(listener);
    };
  }

  async markSeen(userId: UserId, id: string): Promise<void> {
    this.byUser.set(userId, (this.byUser.get(userId) ?? []).map((a) => (a.id === id ? { ...a, seen: true } : a)));
    this.notify(userId);
  }

  /** Lo que en Firebase escribe el servidor; acá lo usa el registro en memoria al validar. */
  grant(userId: UserId, achievements: readonly Achievement[], at: Date): void {
    const current = this.byUser.get(userId) ?? [];
    const fresh = achievements.filter((a) => !current.some((c) => c.id === achievementId(a)));
    this.byUser.set(userId, [...current, ...fresh.map((achievement) => ({ id: achievementId(achievement), achievement, earnedAt: at, seen: false }))]);
    this.notify(userId);
  }

  private unseen(userId: UserId) {
    return (this.byUser.get(userId) ?? []).filter((a) => !a.seen);
  }

  private notify(userId: UserId) {
    for (const listener of this.listeners.get(userId) ?? []) listener(this.unseen(userId));
  }
}
