import { HandleTakenError, type UserId, type UserProfile, type UserProfileRepository } from '@plumario/core';

/** Adaptador en memoria del puerto UserProfileRepository, para la vista web y las pruebas. */
export class InMemoryUserProfileRepository implements UserProfileRepository {
  private readonly profiles = new Map<UserId, UserProfile>();
  private readonly handles = new Map<string, UserId>();

  async get(userId: UserId): Promise<UserProfile | null> {
    return this.profiles.get(userId) ?? null;
  }

  async isHandleAvailable(handle: string): Promise<boolean> {
    return !this.handles.has(handle);
  }

  async create(userId: UserId, profile: UserProfile): Promise<void> {
    const owner = this.handles.get(profile.handle);
    if (owner && owner !== userId) throw new HandleTakenError(profile.handle);
    this.handles.set(profile.handle, userId);
    this.profiles.set(userId, profile);
  }
}
