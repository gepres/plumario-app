import type { Species } from '../../domain/species';

export type SpeciesSuggestion = { speciesId: string; confidence: number };

/**
 * Puerto de salida: la IA que mira la foto. Sugiere especies entre los candidatos (el catálogo de la
 * región) y valida que una foto sea de la especie elegida. El proveedor está por decidir (PA-12): hoy
 * hay un identificador de prueba detrás de este puerto.
 */
export interface SpeciesIdentifier {
  suggest(photoUri: string, candidates: readonly Species[], limit: number): Promise<readonly SpeciesSuggestion[]>;
  validate(photoUri: string, species: Species): Promise<{ valid: boolean; reason?: string }>;
}
