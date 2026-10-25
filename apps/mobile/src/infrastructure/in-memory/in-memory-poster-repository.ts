import type { PosterRepository, SavedPoster, UserId } from '@plumario/core';

/** Adaptador en memoria del puerto PosterRepository, para la vista web. */
export class InMemoryPosterRepository implements PosterRepository {
  private readonly byUser = new Map<UserId, SavedPoster[]>();
  private nextId = 1;

  async listByUser(userId: UserId): Promise<readonly SavedPoster[]> {
    return this.byUser.get(userId) ?? [];
  }

  async save(userId: UserId, poster: Omit<SavedPoster, 'id'>): Promise<string> {
    const id = `poster-${this.nextId++}`;
    this.byUser.set(userId, [...(this.byUser.get(userId) ?? []), { ...poster, id }]);
    return id;
  }
}
