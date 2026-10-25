import type { PhotoLocation } from '../../domain/photo-metadata';
import type { UserId } from '../../domain/sighting';
import type { RegionId, SpeciesId } from '../../domain/species';

/** Un registro guardado en el teléfono hasta que haya señal para subirlo. */
export type QueuedSighting = {
  id: string;
  userId: UserId;
  regionId: RegionId;
  speciesId: SpeciesId;
  /** La copia de la foto en el teléfono (no la temporal de la cámara). */
  photoUri: string;
  takenAt: Date;
  placeName: string | null;
  location: PhotoLocation | null;
  queuedAt: Date;
};

/** Puerto de salida: la cola local de registros sin subir («Registrar sin señal»). */
export interface SightingQueue {
  /** Guarda el registro y una copia de su foto; devuelve cómo quedó (con la ruta de la copia). */
  enqueue(item: Omit<QueuedSighting, 'id' | 'queuedAt'> & { queuedAt: Date }): Promise<QueuedSighting>;
  /** Los del usuario, del más viejo al más nuevo (se suben en ese orden). */
  list(userId: UserId): Promise<readonly QueuedSighting[]>;
  /** Ya subido: se borra de la cola y su copia de la foto. */
  remove(id: string): Promise<void>;
}

/** Lo que lanzan los adaptadores cuando no hay conexión: el registro se guarda en la cola. */
export class NetworkError extends Error {
  constructor(message = 'Sin conexión') {
    super(message);
    this.name = 'NetworkError';
  }
}
