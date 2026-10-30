import { createHash } from 'node:crypto';

// Una foto cuenta una sola vez: el servidor guarda la huella del archivo en
// users/{uid}/photoClaims/{huella} al otorgar lo que corresponde. Detecta el mismo archivo, aunque lo
// suban otra vez o varios registros apunten a él; una foto recortada o editada es otro archivo.

export const DUPLICATE_PHOTO_REASON = 'Esta foto ya está en tu álbum.';

/** La huella del archivo, que es el id de su documento. */
export function photoClaimId(photo: Buffer): string {
  return createHash('sha256').update(photo).digest('hex');
}
