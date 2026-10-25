import type { RegionId, SpeciesId } from './species';

// Reglas de la cuenta (design/project/Registro.dc.html y NuevaContrasena.dc.html).

export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRule = 'length' | 'letter' | 'number';

/** «Al menos 8 caracteres · Una letra · Un número», cada requisito con si se cumple. */
export function passwordRules(password: string): { rule: PasswordRule; met: boolean }[] {
  return [
    { rule: 'length', met: password.length >= PASSWORD_MIN_LENGTH },
    { rule: 'letter', met: /\p{L}/u.test(password) },
    { rule: 'number', met: /\d/.test(password) },
  ];
}

export const isPasswordValid = (password: string) => passwordRules(password).every((r) => r.met);

/** El usuario (@handle) es público: sirve para intercambiar cromos. Minúsculas, números, «_» y «.». */
export const HANDLE_PATTERN = /^[a-z0-9_.]{3,24}$/;

/** Quita la arroba, los espacios de los bordes y pasa a minúsculas lo que escribe la persona. */
export function normalizeHandle(input: string): string {
  return input.trim().replace(/^@+/, '').toLowerCase();
}

export type HandleProblem = 'too-short' | 'too-long' | 'invalid-characters';

export function handleProblem(handle: string): HandleProblem | null {
  if (handle.length < 3) return 'too-short';
  if (handle.length > 24) return 'too-long';
  if (!HANDLE_PATTERN.test(handle)) return 'invalid-characters';
  return null;
}

/** Comprobación básica; la definitiva la hace el servicio de autenticación. */
export const isEmailLike = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** Por ahora el álbum es de Ica; la región se elegirá en el perfil cuando haya más (RegionLista). */
export const DEFAULT_REGION_ID: RegionId = 'ica';

/** PerfilPrivacidad, «Quién puede ver tu álbum»: Solo yo · Con enlace · Todos. */
export type AlbumVisibility = 'private' | 'link' | 'public';

export type Privacy = {
  /** «Guardar la ubicación»: solo para asignar la foto a su región; en amenazadas, nunca. */
  saveLocation: boolean;
  albumVisibility: AlbumVisibility;
  /** «Tu nombre en lo que compartes»: apagado, en pósteres y tarjetas sale el @usuario. */
  showName: boolean;
  /** «Usar tus fotos para mejorar la IA». */
  improveAi: boolean;
};

export type UserProfile = {
  displayName: string;
  handle: string;
  regionId: RegionId;
  /** «Tu ave favorita»: es la foto de perfil; una de las que ya registró. */
  favoriteSpeciesId: SpeciesId | null;
  privacy: Privacy;
  /** La última vez que cambió su @usuario (se puede una vez cada 30 días). */
  handleChangedAt: Date | null;
  createdAt: Date;
};

export const DEFAULT_PRIVACY: Privacy = { saveLocation: false, albumVisibility: 'private', showName: true, improveAi: false };

/** Perfil nuevo con los valores por omisión: Ica, sin guardar ubicación y álbum privado. */
export function newProfile(input: { displayName: string; handle: string; at: Date }): UserProfile {
  return {
    displayName: input.displayName.trim(),
    handle: input.handle,
    regionId: DEFAULT_REGION_ID,
    favoriteSpeciesId: null,
    privacy: DEFAULT_PRIVACY,
    handleChangedAt: null,
    createdAt: input.at,
  };
}

export const DISPLAY_NAME_MAX = 40;

/** «El usuario se puede cambiar una vez cada 30 días» (PerfilEditar). */
export const HANDLE_CHANGE_DAYS = 30;

/** Desde cuándo puede volver a cambiar su @usuario, o null si ya puede. */
export function nextHandleChange(profile: Pick<UserProfile, 'handleChangedAt'>, now: Date): Date | null {
  if (!profile.handleChangedAt) return null;
  const next = new Date(profile.handleChangedAt.getTime() + HANDLE_CHANGE_DAYS * 864e5);
  return next > now ? next : null;
}

/** Cómo se firma en lo que comparte: su nombre o, si prefiere, su @usuario. */
export const sharedName = (profile: Pick<UserProfile, 'displayName' | 'handle' | 'privacy'>) =>
  profile.privacy.showName && profile.displayName ? profile.displayName : `@${profile.handle}`;
