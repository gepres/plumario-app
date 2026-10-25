import type { RegionId } from './species';

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

export type AlbumVisibility = 'private' | 'public';

export type UserProfile = {
  displayName: string;
  handle: string;
  regionId: RegionId;
  privacy: { saveLocation: boolean; albumVisibility: AlbumVisibility };
  createdAt: Date;
};

/** Perfil nuevo con los valores por omisión: Ica, sin guardar ubicación y álbum privado. */
export function newProfile(input: { displayName: string; handle: string; at: Date }): UserProfile {
  return {
    displayName: input.displayName.trim(),
    handle: input.handle,
    regionId: DEFAULT_REGION_ID,
    privacy: { saveLocation: false, albumVisibility: 'private' },
    createdAt: input.at,
  };
}
