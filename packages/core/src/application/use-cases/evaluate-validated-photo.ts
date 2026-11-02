import { newAchievements, type Achievement } from '../../domain/achievements';
import { isInAlbum, summarizeAlbum } from '../../domain/album';
import { nextFinishMilestone } from '../../domain/card';
import { noReward, rewardObservation, type ObservationReward, type Wallet } from '../../domain/economy';
import type { SightingResult } from '../../domain/sighting';
import type { Species } from '../../domain/species';
import { applyValidPhoto, countObservation, observationBlock, type PhotoOutcome, type Sticker } from '../../domain/sticker';

export type ValidatedPhotoResult = PhotoOutcome & {
  /** Logros nuevos por esta foto, para guardarlos y celebrarlos. */
  achievements: Achievement[];
  /** Especies del álbum después de esta foto. */
  registered: number;
  total: number;
  /** Plumas y avance del sobre. */
  reward: ObservationReward;
};

/** Solo las aves del álbum dan premio, y solo si la foto contó como observación. */
function rewardOf(outcome: Pick<PhotoOutcome, 'sticker' | 'counted' | 'coveredMilestone'>, species: Species, wallet: Wallet): ObservationReward {
  return outcome.counted && isInAlbum(species) ? rewardObservation(wallet, outcome.sticker, outcome.coveredMilestone) : noReward(wallet);
}

/**
 * Caso de uso del servidor: qué cambia cuando se valida una foto. Es puro: la Cloud Function lee el
 * estado en una transacción, llama a esto y escribe el resultado. `roll` ∈ [0, 1) decide la suerte de
 * la primera foto, y sin `verified` la recompensa espera a revalidar.
 */
export function evaluateValidatedPhoto(input: {
  species: Species;
  catalog: readonly Species[];
  stickers: readonly Sticker[];
  wallet: Wallet;
  takenAt: Date;
  at: Date;
  roll: number;
  verified: boolean;
}): ValidatedPhotoResult {
  const { species, catalog, stickers, wallet, takenAt, at, roll, verified } = input;
  const current = stickers.find((s) => s.speciesId === species.id) ?? null;
  const outcome = applyValidPhoto({ current, species, takenAt, at, roll, verified });
  const after = [...stickers.filter((s) => s.speciesId !== species.id), outcome.sticker];
  const summary = summarizeAlbum(catalog, after);
  const achievements = outcome.completed && isInAlbum(species) ? newAchievements(summarizeAlbum(catalog, stickers), summary) : [];
  return { ...outcome, achievements, registered: summary.registered, total: summary.total, reward: rewardOf(outcome, species, wallet) };
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
    next: nextFinishMilestone(result.sticker.observations, result.sticker.best),
    validPhotos: result.sticker.validPhotos,
    achievements: result.achievements,
    registered: result.registered,
    total: result.total,
    feathers: result.reward.feathers,
    covered: result.reward.covered,
    packProgress: result.reward.wallet.packSpecies.length,
    packReady: result.reward.pack !== null,
  };
}

/**
 * Una foto que quedó sin revisar y que la IA aprobó después: cuenta si sigue siendo elegible. La suerte
 * y los hitos se otorgan aquí, como si hubiera contado al subirla.
 */
export function evaluateRevalidatedPhoto(input: { sticker: Sticker; species: Species; wallet: Wallet; takenAt: Date; at: Date; roll: number }) {
  const { sticker, species, wallet, takenAt, at, roll } = input;
  const blocked = observationBlock(sticker, species, takenAt, at);
  if (blocked) return { sticker, counted: false, blocked, unlocked: null, coveredMilestone: null, reward: noReward(wallet) };
  const outcome = { ...countObservation(sticker, takenAt, at, roll), counted: true, blocked: null };
  return { ...outcome, reward: rewardOf(outcome, species, wallet) };
}
