import type { UserId } from '../../domain/sighting';

/** Puerto de salida: dónde se guardan las fotos de los registros. */
export interface PhotoStorage {
  /** Sube la foto local con ese nombre y devuelve la ruta con que se guardó. */
  upload(userId: UserId, localUri: string, name: string): Promise<string>;
  /** Una dirección para mostrar la foto guardada en esa ruta. */
  urlFor(path: string): Promise<string>;
}
