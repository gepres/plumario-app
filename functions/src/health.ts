// Junto a la base de Firestore, que está en nam5 (multirregión con centro en us-central1).
export const REGION = 'us-central1';

/** Respuesta de la función de salud: sirve para comprobar que el despliegue o el emulador responden. */
export function getHealth() {
  return { ok: true, service: 'plumario', region: REGION } as const;
}
