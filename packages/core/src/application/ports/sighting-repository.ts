import type { Sighting, UserId } from '../../domain/sighting';
import type { SpeciesId } from '../../domain/species';

/** Puerto de salida: dónde se guardan los registros (fotos) del usuario. */
export interface SightingRepository {
  listByUser(userId: UserId): Promise<readonly Sighting[]>;
  listBySpecies(userId: UserId, speciesId: SpeciesId): Promise<readonly Sighting[]>;
  /** Guarda un registro pendiente de validar; en el teléfono queda guardado aunque no haya señal. */
  add(sighting: Omit<Sighting, 'id' | 'status'>): Promise<Sighting>;
}
