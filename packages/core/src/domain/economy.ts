import { CATEGORY_RANK, MILESTONES, type CardCategory } from './card';
import type { SpeciesId } from './species';
import { grantFinish, limaDay, type FinishSource, type Sticker, type UnlockedFinish } from './sticker';

// Plumas, sobres, repetidas y compra (docs/card-progression.md). Los hitos son seguros y la suerte viene
// en los sobres. Plumas y sobres nunca se venden por dinero. Todo esto lo aplica el servidor, en una
// transacción: los sorteos se reciben de fuera para que las reglas sean deterministas y se puedan probar.

/** Las piezas de los sobres: no traen holográficos, así que no hay repetidas de ese acabado. */
export type PieceFinish = Exclude<CardCategory, 'holographic'>;

export const OBSERVATION_FEATHERS = 1;
/** Lo que paga un hito cuando su acabado ya estaba cubierto. */
export const MILESTONE_FEATHERS: Record<CardCategory, number> = { holographic: 3, silver: 5, gold: 10, ruby: 25, diamond: 60 };
export const FINISH_PRICES: Record<CardCategory, number> = { holographic: 6, silver: 10, gold: 20, ruby: 50, diamond: 120 };
export const RECYCLE_FEATHERS: Record<PieceFinish, number> = { silver: 2, gold: 5, ruby: 12, diamond: 30 };

export const OBSERVATIONS_PER_PACK = 3;
export const PACK_TABLE: readonly { finish: PieceFinish; chance: number }[] = [
  { finish: 'silver', chance: 0.75 },
  { finish: 'gold', chance: 0.2 },
  { finish: 'ruby', chance: 0.04 },
  { finish: 'diamond', chance: 0.01 },
];

/** De más a menos valioso, como se listan las repetidas. */
export const PIECE_FINISHES: readonly PieceFinish[] = ['diamond', 'ruby', 'gold', 'silver'];

/** Los 3 diseños salen al azar en cada sobre. Son solo apariencia: no cambian lo que trae. */
export const PACK_DESIGNS = ['nasca', 'pelicans', 'paracas'] as const;
export type PackDesign = (typeof PACK_DESIGNS)[number];

export type Wallet = {
  /** Puede quedar negativo si una revisión posterior retira plumas ya gastadas. */
  feathers: number;
  /** Las aves de las observaciones que todavía no llenan un sobre. */
  packSpecies: readonly SpeciesId[];
  /** El mes de Lima de la última compra de rubí o diamante. */
  premiumMonth: number | null;
};

export const EMPTY_WALLET: Wallet = { feathers: 0, packSpecies: [], premiumMonth: null };

export type PieceCounts = Readonly<Record<PieceFinish, number>>;
export type SpeciesPieces = { speciesId: SpeciesId; counts: PieceCounts };

export const NO_PIECES: PieceCounts = { silver: 0, gold: 0, ruby: 0, diamond: 0 };

/** Qué trajo un sobre: se decide al abrirlo. */
export type PackOpening = {
  speciesId: SpeciesId;
  finish: PieceFinish;
  /** La pieza superó el acabado y se pegó en el álbum; si no, es una repetida. */
  upgraded: boolean;
  at: Date;
};

export type Pack = {
  id: string;
  speciesIds: readonly SpeciesId[];
  design: PackDesign;
  createdAt: Date;
  opening: PackOpening | null;
};

/** Lo que el usuario tiene de la economía: saldo, sobres sin abrir y repetidas. */
export type Economy = { wallet: Wallet; packs: readonly Pack[]; pieces: readonly SpeciesPieces[] };

export const EMPTY_ECONOMY: Economy = { wallet: EMPTY_WALLET, packs: [], pieces: [] };

/** El acabado que trae un sobre, con `roll` ∈ [0, 1). */
export function packFinish(roll: number): PieceFinish {
  let accumulated = 0;
  for (const { finish, chance } of PACK_TABLE) {
    accumulated += chance;
    if (roll < accumulated) return finish;
  }
  return PACK_TABLE[PACK_TABLE.length - 1]!.finish;
}

/** Una de las aves del sobre. Si la misma se observó varias veces, tiene más opciones. */
export const packSpecies = (speciesIds: readonly SpeciesId[], roll: number): SpeciesId => speciesIds[Math.floor(roll * speciesIds.length)]!;

export const packDesign = (roll: number): PackDesign => PACK_DESIGNS[Math.floor(roll * PACK_DESIGNS.length)]!;

export type CoveredMilestone = { finish: CardCategory; source: FinishSource; feathers: number };

/** Qué pagó un hito cuyo acabado ya estaba. Si lo cubrió una compra, nada: sería un reembolso. */
export function coveredMilestonePayment(sticker: Sticker, observations: number): CoveredMilestone | null {
  const milestone = MILESTONES.find((m) => m.observations === observations);
  if (!milestone) return null;
  const covering: UnlockedFinish | undefined = sticker.unlocked.find((u) => CATEGORY_RANK[u.finish] >= CATEGORY_RANK[milestone.finish]);
  if (!covering || covering.source === 'purchase') return null;
  return { finish: milestone.finish, source: covering.source, feathers: MILESTONE_FEATHERS[milestone.finish] };
}

export type ObservationReward = {
  wallet: Wallet;
  /** Plumas que dio esta observación. */
  feathers: number;
  covered: CoveredMilestone | null;
  /** Las aves del sobre que esta observación llenó; null si todavía no sale. */
  pack: readonly SpeciesId[] | null;
};

/** Sin observación no hay premio: la foto entra en la galería y nada más. */
export const noReward = (wallet: Wallet): ObservationReward => ({ wallet, feathers: 0, covered: null, pack: null });

/** Lo que da una observación válida: 1 pluma, las del hito cubierto y su paso hacia el sobre. */
export function rewardObservation(wallet: Wallet, sticker: Sticker, coveredMilestone: number | null): ObservationReward {
  const covered = coveredMilestone === null ? null : coveredMilestonePayment(sticker, coveredMilestone);
  const feathers = OBSERVATION_FEATHERS + (covered?.feathers ?? 0);
  const filled = [...wallet.packSpecies, sticker.speciesId];
  const full = filled.length >= OBSERVATIONS_PER_PACK;
  return {
    wallet: { ...wallet, feathers: wallet.feathers + feathers, packSpecies: full ? [] : filled },
    feathers,
    covered,
    pack: full ? filled : null,
  };
}

/** Pega la pieza si supera el acabado; si no, queda como repetida. El álbum nunca retrocede. */
export function applyPackPiece(input: { sticker: Sticker; counts: PieceCounts; finish: PieceFinish; at: Date }) {
  const { sticker, counts, finish, at } = input;
  const granted = grantFinish(sticker, finish, 'pack', at);
  if (granted.unlocked) return { sticker: granted.sticker, counts, upgraded: true };
  return { sticker, counts: { ...counts, [finish]: counts[finish] + 1 }, upgraded: false };
}

/** Cambia una repetida por plumas; null si no la tiene. */
export function recyclePiece(wallet: Wallet, counts: PieceCounts, finish: PieceFinish) {
  if (counts[finish] < 1) return null;
  const feathers = RECYCLE_FEATHERS[finish];
  return { wallet: { ...wallet, feathers: wallet.feathers + feathers }, counts: { ...counts, [finish]: counts[finish] - 1 }, feathers };
}

const FINISHES = Object.keys(CATEGORY_RANK) as CardCategory[];

/** El acabado que sigue; null si ya es diamante. Sin acabado, el primero. */
export function nextFinish(best: CardCategory | null): CardCategory | null {
  if (!best) return FINISHES[0]!;
  return FINISHES[CATEGORY_RANK[best] + 1] ?? null;
}

const isPremium = (finish: CardCategory) => CATEGORY_RANK[finish] >= CATEGORY_RANK.ruby;

/** El mes en Lima, como número de meses. */
export function limaMonth(date: Date): number {
  const day = new Date(limaDay(date) * 24 * 60 * 60 * 1000);
  return day.getUTCFullYear() * 12 + day.getUTCMonth();
}

/** Cuándo se puede volver a comprar un rubí o un diamante; null si ya se puede. A mediodía, para que el día no cambie con el huso. */
export function premiumAvailableAt(wallet: Wallet, now: Date): Date | null {
  if (wallet.premiumMonth !== limaMonth(now)) return null;
  const next = wallet.premiumMonth + 1;
  return new Date(Date.UTC(Math.floor(next / 12), next % 12, 1, 12));
}

export type PurchaseProblem = 'not-registered' | 'top-finish' | 'not-next' | 'monthly-limit' | 'not-enough';

/** Por qué no se puede comprar; null si se puede. `finish` es lo que la persona vio: un doble toque no sube dos niveles. */
export function purchaseProblem(input: { sticker: Sticker | null; wallet: Wallet; finish: CardCategory; at: Date }): PurchaseProblem | null {
  const { sticker, wallet, finish, at } = input;
  if (!sticker) return 'not-registered';
  const next = nextFinish(sticker.best);
  if (!next) return 'top-finish';
  if (finish !== next) return 'not-next';
  if (isPremium(finish) && premiumAvailableAt(wallet, at)) return 'monthly-limit';
  return wallet.feathers < FINISH_PRICES[finish] ? 'not-enough' : null;
}

/** Sube la carta al acabado comprado. Comprar no suma observaciones ni cobra hitos. */
export function applyPurchase(input: { sticker: Sticker; wallet: Wallet; finish: CardCategory; at: Date }) {
  const { sticker, wallet, finish, at } = input;
  return {
    sticker: grantFinish(sticker, finish, 'purchase', at).sticker,
    wallet: { ...wallet, feathers: wallet.feathers - FINISH_PRICES[finish], premiumMonth: isPremium(finish) ? limaMonth(at) : wallet.premiumMonth },
  };
}

export type DuplicateGroup = { finish: PieceFinish; total: number; pieces: readonly { speciesId: SpeciesId; count: number }[] };

/** Las repetidas agrupadas por acabado, de más a menos valioso (MisRepetidas). */
export function duplicatesByFinish(pieces: readonly SpeciesPieces[]): DuplicateGroup[] {
  return PIECE_FINISHES.flatMap((finish) => {
    const owned = pieces.filter((p) => p.counts[finish] > 0).map((p) => ({ speciesId: p.speciesId, count: p.counts[finish] }));
    return owned.length ? [{ finish, total: owned.reduce((sum, p) => sum + p.count, 0), pieces: owned }] : [];
  });
}
