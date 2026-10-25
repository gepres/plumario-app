import { DISPLAY_NAME_MAX, handleProblem, isEmailLike, nextHandleChange, normalizeHandle, type HandleProblem, type UserProfile } from '../../domain/account';
import { FEEDBACK_MAX, type Feedback } from '../../domain/feedback';
import type { UserId } from '../../domain/sighting';
import type { AchievementRepository } from '../ports/achievement-repository';
import { AuthError, type AuthService } from '../ports/auth-service';
import type { FeedbackRepository } from '../ports/feedback-repository';
import type { PhotoStorage } from '../ports/photo-storage';
import type { PosterRepository } from '../ports/poster-repository';
import type { SightingRepository } from '../ports/sighting-repository';
import type { StickerRepository } from '../ports/sticker-repository';
import { HandleTakenError, type ProfileChanges, type UserProfileRepository } from '../ports/user-profile-repository';

// Casos de uso del perfil (design/project/Perfil*.dc.html).

export type ProfileProblem = 'name-empty' | 'name-too-long' | HandleProblem | 'handle-too-soon' | 'handle-taken';

export class ProfileError extends Error {
  constructor(readonly problem: ProfileProblem, readonly until?: Date) {
    super(`Perfil: ${problem}`);
    this.name = 'ProfileError';
  }
}

/** PerfilEditar y PerfilPrivacidad: guarda nombre, ave favorita y privacidad. */
export function makeUpdateProfile(deps: { profiles: UserProfileRepository }) {
  return async (userId: UserId, changes: ProfileChanges): Promise<void> => {
    const next = { ...changes };
    if (next.displayName !== undefined) {
      next.displayName = next.displayName.trim();
      if (!next.displayName) throw new ProfileError('name-empty');
      if (next.displayName.length > DISPLAY_NAME_MAX) throw new ProfileError('name-too-long');
    }
    await deps.profiles.update(userId, next);
  };
}

/** «Usuario · Se puede cambiar una vez cada 30 días». Devuelve el @usuario con que quedó. */
export function makeChangeHandle(deps: { profiles: UserProfileRepository; now: () => Date }) {
  return async (userId: UserId, profile: Pick<UserProfile, 'handle' | 'handleChangedAt'>, input: string): Promise<string> => {
    const handle = normalizeHandle(input);
    if (handle === profile.handle) return handle;
    const problem = handleProblem(handle);
    if (problem) throw new ProfileError(problem);
    const now = deps.now();
    const until = nextHandleChange(profile, now);
    if (until) throw new ProfileError('handle-too-soon', until);
    if (!(await deps.profiles.isHandleAvailable(handle))) throw new ProfileError('handle-taken');
    try {
      await deps.profiles.changeHandle(userId, profile.handle, handle, now);
    } catch (error) {
      if (error instanceof HandleTakenError) throw new ProfileError('handle-taken');
      throw error;
    }
    return handle;
  };
}

/** Cambiar el correo: hace falta la contraseña; el cambio se confirma desde el correo nuevo. */
export function makeChangeEmail(deps: { auth: AuthService }) {
  return async (email: string, password: string): Promise<void> => {
    if (!isEmailLike(email)) throw new AuthError('invalid-email');
    await deps.auth.changeEmail(email.trim(), password);
  };
}

/** «Eliminar tu cuenta»: con la contraseña; el servidor borra el álbum, las fotos y el @usuario. */
export function makeDeleteAccount(deps: { auth: AuthService }) {
  return (password: string) => deps.auth.deleteAccount(password);
}

export class FeedbackError extends Error {
  constructor(readonly problem: 'empty' | 'too-long') {
    super(`Comentario: ${problem}`);
    this.name = 'FeedbackError';
  }
}

/** PerfilComentario: «Leemos todo». */
export function makeSendFeedback(deps: { feedback: FeedbackRepository; now: () => Date }) {
  return async (input: Omit<Feedback, 'createdAt'>): Promise<void> => {
    const text = input.text.trim();
    if (!text) throw new FeedbackError('empty');
    if (text.length > FEEDBACK_MAX) throw new FeedbackError('too-long');
    await deps.feedback.send({ ...input, text, createdAt: deps.now() });
  };
}

/**
 * «Descargar tus datos: fotos, registros y recompensas en un archivo». Las fotos van como enlaces
 * (las que ya no se pueden leer, sin enlace).
 */
export function makeExportUserData(deps: {
  profiles: UserProfileRepository;
  stickers: StickerRepository;
  sightings: SightingRepository;
  achievements: AchievementRepository;
  posters: PosterRepository;
  photos: PhotoStorage;
  now: () => Date;
}) {
  return async (userId: UserId) => {
    const [profile, stickers, sightings, achievements, posters] = await Promise.all([
      deps.profiles.get(userId),
      deps.stickers.listByUser(userId),
      deps.sightings.listByUser(userId),
      deps.achievements.listByUser(userId),
      deps.posters.listByUser(userId),
    ]);
    const withPhotos = await Promise.all(
      sightings.map(async (s) => ({ ...s, photoUrl: s.photoPath ? await deps.photos.urlFor(s.photoPath).catch(() => null) : null })),
    );
    return { exportedAt: deps.now(), userId, profile, stickers, sightings: withPhotos, achievements, posters };
  };
}
