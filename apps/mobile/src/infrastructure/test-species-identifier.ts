import type { SpeciesIdentifier } from '@plumario/core';

/**
 * Identificador de prueba (puerto SpeciesIdentifier) hasta elegir el proveedor de IA (PA-12).
 * Sugiere especies del catálogo de forma estable para cada foto (la misma foto, las mismas
 * sugerencias) y da toda foto por buena, salvo que su nombre contenga «rechazar». El proveedor
 * real correrá en una Cloud Function, para que la clave nunca viaje en la app.
 */
export const testSpeciesIdentifier: SpeciesIdentifier = {
  async suggest(photoUri, candidates, limit) {
    let seed = [...photoUri].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const pool = [...candidates];
    const picked = [];
    while (picked.length < limit && pool.length) picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0]!);
    const confidences = [0.82, 0.41, 0.17, 0.08, 0.04];
    return picked.map((species, i) => ({ speciesId: species.id, confidence: confidences[i] ?? 0.02 }));
  },

  async validate(photoUri, species) {
    if (photoUri.includes('rechazar')) return { valid: false, reason: `La foto no parece de ${species.commonName}.` };
    return { valid: true };
  },
};
