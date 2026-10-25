import type { UserId } from '../../domain/sighting';

/** Puerto de salida: dónde se guardan las fotos. Devuelve la ruta con que se guardó. */
export interface PhotoStorage {
  upload(userId: UserId, localUri: string): Promise<string>;
}
