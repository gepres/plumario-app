import { HandleTakenError, newProfile, type ProfileChanges, type UserId, type UserProfile, type UserProfileRepository } from '@plumario/core';

/** El perfil de la cuenta de muestra, para ver Perfil en la web. */
export const SAMPLE_PROFILE: UserProfile = { ...newProfile({ displayName: 'Coleccionista', handle: 'coleccionista', at: new Date(2026, 2, 14) }), favoriteSpeciesId: 'gaviotin-peruano' };

/** Adaptador en memoria del puerto UserProfileRepository, para la vista web y las pruebas. */
export class InMemoryUserProfileRepository implements UserProfileRepository {
  private readonly profiles = new Map<UserId, UserProfile>();
  private readonly handles = new Map<string, UserId>();

  constructor(initial: Record<UserId, UserProfile> = {}) {
    for (const [userId, profile] of Object.entries(initial)) {
      this.profiles.set(userId, profile);
      this.handles.set(profile.handle, userId);
    }
  }

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

  async update(userId: UserId, changes: ProfileChanges): Promise<void> {
    const profile = this.profiles.get(userId);
    if (profile) this.profiles.set(userId, { ...profile, ...changes });
  }

  async changeHandle(userId: UserId, from: string, to: string, at: Date): Promise<void> {
    const owner = this.handles.get(to);
    if (owner && owner !== userId) throw new HandleTakenError(to);
    const profile = this.profiles.get(userId);
    if (!profile) return;
    this.handles.delete(from);
    this.handles.set(to, userId);
    this.profiles.set(userId, { ...profile, handle: to, handleChangedAt: at });
  }
}
