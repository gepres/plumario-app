import type { Achievement } from './achievements';
import type { CardCategory } from './card';
import type { RegionId, SpeciesId } from './species';
import type { ChromeSource } from './sticker';

export type UserId = string;

/**
 * Un registro: la foto de un ave que el usuario eligió para una especie. Queda pendiente hasta que se
 * valida (que la foto sea de esa especie); solo las validadas cuentan para el sticker y el cromo.
 */
export type SightingStatus = 'pending' | 'validated' | 'rejected';

/** Lo que pasó con la foto, que escribe el servidor al validarla (RegistrarCompletado, Revelar…). */
export type SightingResult =
  | {
      outcome: 'validated';
      /** Esta foto completó el sticker: especie nueva en el álbum. */
      completed: boolean;
      /** Esta foto lo dejó cromado, y por qué vía. */
      chromed: ChromeSource | null;
      category: CardCategory;
      /** Fotos validadas de la especie, contando esta. */
      validPhotos: number;
      /** Logros que dio esta foto. */
      achievements: Achievement[];
      /** Especies del álbum después de esta foto. */
      registered: number;
      total: number;
    }
  | { outcome: 'rejected'; reason: string };

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
  /** «Lugar» que escribe la persona (RegistrarColocar). Nunca se guarda en especies amenazadas. */
  placeName: string | null;
  createdAt: Date;
  /** null mientras está pendiente. */
  result: SightingResult | null;
};

/** Largo máximo del «Lugar» (también en firestore.rules). */
export const PLACE_NAME_MAX = 60;
