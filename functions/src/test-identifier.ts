import type { Species } from '@plumario/core';

/**
 * Validación de prueba en el servidor, hasta elegir el proveedor de IA (PA-12): da por buena toda
 * foto, salvo que su nombre contenga «rechazar», para poder probar el caso en que la IA no reconoce
 * la especie. El proveedor real mirará la foto en Storage y responderá lo mismo.
 */
export async function validatePhoto(photoPath: string, species: Species): Promise<{ valid: boolean; reason?: string }> {
  if (photoPath.includes('rechazar')) return { valid: false, reason: `No se reconoce a ${species.commonName} en la foto.` };
  return { valid: true };
}
