import { createVersionStore } from './version-store';

// Cuándo hay que volver a pedir el perfil: al editarlo (nombre, @usuario, ave favorita, privacidad).

const profile = createVersionStore();

export const invalidateProfile = profile.invalidate;

export function useProfileVersion(): number {
  return profile.useVersion();
}
