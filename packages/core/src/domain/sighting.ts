import type { Achievement } from './achievements';
import type { CardCategory, Milestone } from './card';
import type { CoveredMilestone } from './economy';
import type { RegionId, SpeciesId } from './species';
import type { NotCounted, UnlockedFinish } from './sticker';

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
      /** Contó como observación; si no, `blocked` dice por qué. */
      counted: boolean;
      blocked: NotCounted | null;
      /** El acabado que subió la carta con esta foto. */
      unlocked: UnlockedFinish | null;
      /** El mejor acabado de la especie después de esta foto. */
      finish: CardCategory | null;
      observations: number;
      /** El hito que sigue. */
      next: Milestone | null;
      /** Fotos validadas de la especie, contando esta. */
      validPhotos: number;
      /** Logros que dio esta foto. */
      achievements: Achievement[];
      /** Especies del álbum después de esta foto. */
      registered: number;
      total: number;
      /** Plumas que dio esta foto, contando el hito cubierto. */
      feathers: number;
      /** El hito que ya estaba cubierto y pagó plumas en lugar de dar un acabado. */
      covered: CoveredMilestone | null;
      /** Observaciones hacia el próximo sobre, de 0 a 2. */
      packProgress: number;
      /** Esta foto llenó un sobre: su id es el del registro. */
      packReady: boolean;
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
