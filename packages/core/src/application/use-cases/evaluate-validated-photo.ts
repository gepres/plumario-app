import { newAchievements, type Achievement } from '../../domain/achievements';
import { isInAlbum, summarizeAlbum } from '../../domain/album';
import { nextFinishMilestone } from '../../domain/card';
import type { SightingResult } from '../../domain/sighting';
import type { Species } from '../../domain/species';
import { applyValidPhoto, countObservation, observationBlock, type PhotoOutcome, type Sticker } from '../../domain/sticker';

export type ValidatedPhotoResult = PhotoOutcome & {
  /** Logros nuevos por esta foto, para guardarlos y celebrarlos. */
  achievements: Achievement[];
  /** Especies del álbum después de esta foto. */
  registered: number;
  total: number;
};

/**
 * Caso de uso del servidor: qué cambia cuando se valida una foto. Es puro: la Cloud Function lee el
 * estado en una transacción, llama a esto y escribe el resultado. `roll` ∈ [0, 1) decide la suerte de
 * la primera foto, y sin `verified` la recompensa espera a revalidar.
 */
export function evaluateValidatedPhoto(input: {
  species: Species;
  catalog: readonly Species[];
  stickers: readonly Sticker[];
  takenAt: Date;
  at: Date;
  roll: number;
  verified: boolean;
}): ValidatedPhotoResult {
  const { species, catalog, stickers, takenAt, at, roll, verified } = input;
  const current = stickers.find((s) => s.speciesId === species.id) ?? null;
  const outcome = applyValidPhoto({ current, species, takenAt, at, roll, verified });
  const after = [...stickers.filter((s) => s.speciesId !== species.id), outcome.sticker];
  const summary = summarizeAlbum(catalog, after);
  const achievements = outcome.completed && isInAlbum(species) ? newAchievements(summarizeAlbum(catalog, stickers), summary) : [];
  return { ...outcome, achievements, registered: summary.registered, total: summary.total };
}

/** El resultado que el servidor deja en el registro validado, para que la app lo muestre. */
export function sightingResultOf(result: ValidatedPhotoResult): SightingResult {
  return {
    outcome: 'validated',
    completed: result.completed,
    counted: result.counted,
    blocked: result.blocked,
    unlocked: result.unlocked,
    finish: result.sticker.best,
    observations: result.sticker.observations,
    next: nextFinishMilestone(result.sticker.observations),
    validPhotos: result.sticker.validPhotos,
    achievements: result.achievements,
    registered: result.registered,
    total: result.total,
  };
}

/**
 * Una foto que quedó sin revisar y que la IA aprobó después: cuenta si sigue siendo elegible. La suerte
 * y los hitos se otorgan aquí, como si hubiera contado al subirla.
 */
export function evaluateRevalidatedPhoto(input: { sticker: Sticker; species: Species; takenAt: Date; at: Date; roll: number }) {
  const { sticker, species, takenAt, at, roll } = input;
  const blocked = observationBlock(sticker, species, takenAt, at);
  if (blocked) return { sticker, counted: false, blocked, unlocked: null, coveredMilestone: null };
  return { ...countObservation(sticker, takenAt, at, roll), counted: true, blocked: null };
}
