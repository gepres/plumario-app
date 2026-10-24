import type { Sighting, SightingRepository, UserId } from '@plumario/core';

/**
 * Adaptador en memoria del puerto SightingRepository: los registros viven mientras la app esté
 * abierta. Sirve hasta que exista el adaptador de Firestore (tarjeta del modelo de datos).
 */
export class InMemorySightingRepository implements SightingRepository {
  private readonly sightings: Sighting[];

  constructor(initial: readonly Sighting[] = []) {
    this.sightings = [...initial];
  }

  async listByUser(userId: UserId): Promise<readonly Sighting[]> {
    return this.sightings.filter((s) => s.userId === userId);
  }
}
