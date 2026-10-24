// Debe coincidir con la ubicación de Firestore elegida al crear el proyecto real.
export const REGION = 'southamerica-west1';

/** Respuesta de la función de salud: sirve para comprobar que el despliegue o el emulador responden. */
export function getHealth() {
  return { ok: true, service: 'plumario', region: REGION } as const;
}
