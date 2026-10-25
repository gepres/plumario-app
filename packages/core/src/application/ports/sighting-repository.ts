import type { Sighting, UserId } from '../../domain/sighting';
import type { SpeciesId } from '../../domain/species';

/** Puerto de salida: dónde se guardan los registros (fotos) del usuario. */
export interface SightingRepository {
  /** Un id nuevo para un registro, para nombrar su foto antes de guardarlo. */
  newId(userId: UserId): string;
  /** Guarda un registro pendiente de validar; el servidor lo valida y le escribe el resultado. */
  add(sighting: Sighting): Promise<void>;
  /** Avisa cada vez que cambia el registro (al validarse); devuelve la función para dejar de escuchar. */
  watch(userId: UserId, sightingId: string, listener: (sighting: Sighting | null) => void): () => void;
  /** Los registros de una especie, del más reciente al más antiguo (GaleriaEspecie). */
  listBySpecies(userId: UserId, speciesId: SpeciesId): Promise<readonly Sighting[]>;
  /** Todos los registros del usuario (Descargar tus datos). */
  listByUser(userId: UserId): Promise<readonly Sighting[]>;
}
