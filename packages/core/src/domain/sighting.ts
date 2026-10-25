import type { RegionId, SpeciesId } from './species';

export type UserId = string;

/**
 * Un registro: la foto de un ave que el usuario eligió para una especie. Queda pendiente hasta que se
 * valida (que la foto sea de esa especie); solo las validadas cuentan para el sticker y el cromo.
 */
export type SightingStatus = 'pending' | 'validated' | 'rejected';

export type Sighting = {
  id: string;
  userId: UserId;
  speciesId: SpeciesId;
  regionId: RegionId;
  takenAt: Date;
  status: SightingStatus;
  /** Ruta de la foto en el almacenamiento. */
  photoPath: string | null;
  /** Solo sirve para asignar la región; nadie más la ve (PerfilPrivacidad). */
  location: { latitude: number; longitude: number } | null;
};
