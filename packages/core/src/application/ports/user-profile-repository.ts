import type { UserProfile } from '../../domain/account';
import type { UserId } from '../../domain/sighting';

export class HandleTakenError extends Error {
  constructor(readonly handle: string) {
    super(`El usuario @${handle} ya existe`);
    this.name = 'HandleTakenError';
  }
}

/** Puerto de salida: perfiles de usuario y la reserva de cada @usuario, que es único. */
export interface UserProfileRepository {
  get(userId: UserId): Promise<UserProfile | null>;
  isHandleAvailable(handle: string): Promise<boolean>;
  /** Crea el perfil y reserva su @usuario en una sola escritura; HandleTakenError si ya es de otro. */
  create(userId: UserId, profile: UserProfile): Promise<void>;
  /** PerfilEditar y PerfilPrivacidad: nombre, ave favorita y privacidad. */
  update(userId: UserId, changes: ProfileChanges): Promise<void>;
  /** Cambia el @usuario: reserva el nuevo y libera el anterior en una sola escritura; HandleTakenError si ya es de otro. */
  changeHandle(userId: UserId, from: string, to: string, at: Date): Promise<void>;
}

export type ProfileChanges = Partial<Pick<UserProfile, 'displayName' | 'favoriteSpeciesId' | 'privacy' | 'regionAlerts' | 'notifications'>>;
