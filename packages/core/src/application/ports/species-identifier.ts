import type { Species } from '../../domain/species';

export type SpeciesSuggestion = { speciesId: string; confidence: number };

/**
 * Puerto de salida: la IA que mira la foto. Sugiere especies entre los candidatos (el catálogo de la
 * región) y valida que una foto sea de la especie elegida. En la app real es Gemini, en una Cloud
 * Function; sin Firebase, un identificador de prueba.
 */
export interface SpeciesIdentifier {
  suggest(photoUri: string, candidates: readonly Species[], limit: number): Promise<readonly SpeciesSuggestion[]>;
  validate(photoUri: string, species: Species): Promise<{ valid: boolean; reason?: string }>;
}

/**
 * La IA no pudo mirar la foto: sin conexión o sin respuesta (`unavailable`), o la persona ya usó las
 * consultas del día (`quota`). Igual se puede elegir la especie a mano.
 */
export class IdentifierError extends Error {
  constructor(readonly reason: 'unavailable' | 'quota') {
    super(`La IA no está disponible (${reason})`);
    this.name = 'IdentifierError';
  }
}
