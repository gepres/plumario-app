import { CATEGORY_RANK, CHROME_CHANCE, MILESTONES, betterFinish, type CardCategory } from './card';
import type { Species, SpeciesId } from './species';

// Un sticker por especie y por usuario. Una foto validada entra siempre en la galería, pero solo
// avanza la carta si cuenta como observación (docs/card-progression.md).

/** De dónde salió un acabado. Los sobres y la compra llegan en la fase 2A. */
export type FinishSource = 'luck' | 'milestone' | 'pack' | 'purchase' | 'trade';

export type UnlockedFinish = { finish: CardCategory; source: FinishSource; at: Date };

export type Sticker = {
  speciesId: SpeciesId;
  /** La primera foto validada completa el sticker. */
  completedAt: Date;
  /** Fotos en la galería: todas las validadas, cuenten o no como observación. */
  validPhotos: number;
  /** Fotos que contaron. Los hitos salen de aquí. */
  observations: number;
  /** Cuándo se tomó la última foto que contó. */
  lastCountedAt: Date | null;
  /** Observaciones contadas en el día del servidor, para el tope de `SERVER_DAILY_LIMIT`. */
  serverDay: number | null;
  serverCount: number;
  /** El mejor acabado; null es la carta normal. Nunca retrocede. */
  best: CardCategory | null;
  /** El mejor ganado sin intercambio: lo único que se podrá ofrecer. */
  ownBest: CardCategory | null;
  /** El hito más alto ya cobrado: nunca baja, así un hito no se cobra dos veces. */
  claimedMilestone: number;
  unlocked: readonly UnlockedFinish[];
};

/** Por qué una foto validada no contó como observación. */
export type NotCounted = 'today' | 'week' | 'server-limit' | 'review';

export type PhotoOutcome = {
  sticker: Sticker;
  /** Esta foto completó el sticker (especie nueva en el álbum). */
  completed: boolean;
  counted: boolean;
  blocked: NotCounted | null;
  /** El acabado que subió la carta con esta foto. */
  unlocked: UnlockedFinish | null;
  /** Hito alcanzado con un acabado que ya tenía: en la fase 2A pagará plumas. */
  coveredMilestone: number | null;
};

// Perú no cambia de hora: siempre es UTC−5.
const LIMA_OFFSET = 5 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

/** El día en Lima, como número de días: el día de una observación no depende del huso del teléfono. */
export const limaDay = (date: Date) => Math.floor((date.getTime() - LIMA_OFFSET) / DAY);

/** Como `takenAt` lo manda el teléfono, el servidor no admite más que esto por especie y día. */
export const SERVER_DAILY_LIMIT = 3;
export const THREATENED_WAIT_DAYS = 7;

export function newSticker(speciesId: SpeciesId, at: Date): Sticker {
  return {
    speciesId, completedAt: at, validPhotos: 0, observations: 0, lastCountedAt: null,
    serverDay: null, serverCount: 0, best: null, ownBest: null, claimedMilestone: 0, unlocked: [],
  };
}

/** El último acabado que ganó la carta, el que tiene hoy. */
export const lastUnlocked = (sticker: Sticker): UnlockedFinish | null => sticker.unlocked[sticker.unlocked.length - 1] ?? null;

/** Por qué esta foto no puede contar; null si cuenta. */
export function observationBlock(sticker: Sticker, species: Pick<Species, 'threatened'>, takenAt: Date, now: Date): NotCounted | null {
  if (sticker.serverDay === limaDay(now) && sticker.serverCount >= SERVER_DAILY_LIMIT) return 'server-limit';
  if (!sticker.lastCountedAt) return null;
  const taken = takenAt > now ? now : takenAt;
  const gap = limaDay(taken) - limaDay(sticker.lastCountedAt);
  if (species.threatened) return gap >= THREATENED_WAIT_DAYS ? null : 'week';
  return gap >= 1 ? null : 'today';
}

/** Sube el acabado si `finish` supera al que tiene; el que ya tiene nunca baja. */
export function grantFinish(sticker: Sticker, finish: CardCategory, source: FinishSource, at: Date): { sticker: Sticker; unlocked: UnlockedFinish | null } {
  if (sticker.best && CATEGORY_RANK[finish] <= CATEGORY_RANK[sticker.best]) return { sticker, unlocked: null };
  const unlocked = { finish, source, at };
  return {
    sticker: {
      ...sticker,
      best: finish,
      ownBest: source === 'trade' ? sticker.ownBest : betterFinish(sticker.ownBest, finish),
      unlocked: [...sticker.unlocked, unlocked],
    },
    unlocked,
  };
}

/**
 * Cuenta una observación ya elegible: suma al contador y otorga la suerte de la primera o el hito.
 * `roll` ∈ [0, 1) se recibe de fuera para que la regla sea determinista y se pueda probar.
 */
export function countObservation(sticker: Sticker, takenAt: Date, now: Date, roll: number): Pick<PhotoOutcome, 'sticker' | 'unlocked' | 'coveredMilestone'> {
  const taken = takenAt > now ? now : takenAt;
  const today = limaDay(now);
  const counted: Sticker = {
    ...sticker,
    observations: sticker.observations + 1,
    lastCountedAt: !sticker.lastCountedAt || taken > sticker.lastCountedAt ? taken : sticker.lastCountedAt,
    serverDay: today,
    serverCount: sticker.serverDay === today ? sticker.serverCount + 1 : 1,
  };
  if (sticker.observations === 0 && roll < CHROME_CHANCE) return { ...grantFinish(counted, 'holographic', 'luck', now), coveredMilestone: null };

  const milestone = MILESTONES.find((m) => m.observations === counted.observations && m.observations > counted.claimedMilestone);
  if (!milestone) return { sticker: counted, unlocked: null, coveredMilestone: null };
  const claimed = { ...counted, claimedMilestone: milestone.observations };
  const result = grantFinish(claimed, milestone.finish, 'milestone', now);
  return { ...result, coveredMilestone: result.unlocked ? null : milestone.observations };
}

/**
 * Aplica una foto validada al sticker de su especie. Sin `verified`, la IA no pudo revisarla: la foto y
 * el sticker entran, y contador y recompensas esperan a revalidar.
 */
export function applyValidPhoto(input: {
  current: Sticker | null;
  species: Pick<Species, 'id' | 'threatened'>;
  takenAt: Date;
  at: Date;
  roll: number;
  verified: boolean;
}): PhotoOutcome {
  const { current, species, takenAt, at, roll, verified } = input;
  const base = current ?? newSticker(species.id, at);
  const sticker = { ...base, validPhotos: base.validPhotos + 1 };
  const completed = !current;
  const blocked = verified ? observationBlock(sticker, species, takenAt, at) : 'review';
  if (blocked) return { sticker, completed, counted: false, blocked, unlocked: null, coveredMilestone: null };
  return { ...countObservation(sticker, takenAt, at, roll), completed, counted: true, blocked: null };
}
