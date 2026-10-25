import type { SavedPoster } from '../../domain/posters';
import type { UserId } from '../../domain/sighting';

/** Puerto de salida: los pósteres que guarda el usuario (PosterGenerar → PosterListo). */
export interface PosterRepository {
  listByUser(userId: UserId): Promise<readonly SavedPoster[]>;
  /** Guarda el póster y devuelve su id. */
  save(userId: UserId, poster: Omit<SavedPoster, 'id'>): Promise<string>;
}
