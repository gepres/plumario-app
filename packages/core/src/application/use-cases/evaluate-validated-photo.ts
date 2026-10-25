import { newAchievements, type Achievement } from '../../domain/achievements';
import { isInAlbum, summarizeAlbum } from '../../domain/album';
import { categoryOf, type CardCategory } from '../../domain/card';
import type { SightingResult } from '../../domain/sighting';
import type { Species } from '../../domain/species';
import { applyValidPhoto, type PhotoOutcome, type Sticker } from '../../domain/sticker';

export type ValidatedPhotoResult = PhotoOutcome & {
  category: CardCategory;
  /** Logros nuevos por esta foto, para guardarlos y celebrarlos. */
  achievements: Achievement[];
  /** Especies del álbum después de esta foto. */
  registered: number;
  total: number;
};

/**
 * Caso de uso del servidor: qué cambia cuando se valida una foto. Es puro: la Cloud Function lee el
 * estado en una transacción, llama a esto y escribe el resultado. `roll` ∈ [0, 1) decide el cromo al azar.
 */
export function evaluateValidatedPhoto(input: {
  species: Species;
  catalog: readonly Species[];
  stickers: readonly Sticker[];
  at: Date;
  roll: number;
}): ValidatedPhotoResult {
  const current = input.stickers.find((s) => s.speciesId === input.species.id) ?? null;
  const outcome = applyValidPhoto(current, input.species.id, input.at, input.roll);
  const after = [...input.stickers.filter((s) => s.speciesId !== input.species.id), outcome.sticker];
  const summary = summarizeAlbum(input.catalog, after);
  const achievements = outcome.completed && isInAlbum(input.species) ? newAchievements(summarizeAlbum(input.catalog, input.stickers), summary) : [];
  return { ...outcome, category: categoryOf(input.species), achievements, registered: summary.registered, total: summary.total };
}

/** El resultado que el servidor deja en el registro validado, para que la app lo muestre. */
export function sightingResultOf(result: ValidatedPhotoResult): SightingResult {
  return {
    outcome: 'validated',
    completed: result.completed,
    chromed: result.chromed,
    category: result.category,
    validPhotos: result.sticker.validPhotos,
    achievements: result.achievements,
    registered: result.registered,
    total: result.total,
  };
}
