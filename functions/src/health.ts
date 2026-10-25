// Junto a la base de Firestore, que está en southamerica-west1 (Santiago). Solo la segunda
// generación corre ahí.
export const REGION = 'southamerica-west1';

// Los triggers de Auth solo existen en la primera generación, que no corre en Santiago: van a São
// Paulo, la región más cercana que la tiene.
export const AUTH_TRIGGER_REGION = 'southamerica-east1';

/** Respuesta de la función de salud: sirve para comprobar que el despliegue o el emulador responden. */
export function getHealth() {
  return { ok: true, service: 'plumario', region: REGION } as const;
}
