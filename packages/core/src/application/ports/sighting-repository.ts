import type { Sighting, UserId } from '../../domain/sighting';

/** Puerto de salida: dónde se guardan los registros del usuario. */
export interface SightingRepository {
  listByUser(userId: UserId): Promise<readonly Sighting[]>;
}
