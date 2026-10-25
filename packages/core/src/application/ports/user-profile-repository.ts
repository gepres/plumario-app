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
}
