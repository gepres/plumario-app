import { Timestamp } from 'firebase-admin/firestore';

import { CATEGORY_RANK, HABITATS, PIECE_FINISHES, figureOf, type CardCategory, type FinishSource, type PackDesign, type PackOpening, type PieceCounts, type Species, type Sticker, type TaxonClass, type Wallet } from '@plumario/core';

// Documentos de Firestore → tipos del núcleo, del lado del servidor (Admin SDK). Los mismos campos
// que lee la app (apps/mobile/src/infrastructure/firebase).

const TAXON_CLASSES: readonly TaxonClass[] = ['bird', 'mammal', 'reptile'];
const CARD_CATEGORIES = Object.keys(CATEGORY_RANK) as CardCategory[];
const FINISH_SOURCES: readonly FinishSource[] = ['luck', 'milestone', 'pack', 'purchase', 'trade'];

const toDate = (value: unknown) => (value instanceof Timestamp ? value.toDate() : new Date(0));
const text = (value: unknown) => (typeof value === 'string' ? value : null);

export function toSpecies(id: string, data: Record<string, unknown>): Species {
  const scientificName = text(data.scientificName) ?? id;
  return {
    id,
    regionId: String(data.regionId),
    taxonClass: TAXON_CLASSES.find((c) => c === data.taxonClass) ?? 'bird',
    albumNumber: typeof data.albumNumber === 'number' ? data.albumNumber : null,
    commonName: text(data.commonName) || scientificName,
    scientificName,
    habitat: HABITATS.find((h) => h === data.habitat) ?? null,
    family: text(data.family),
    iucn: text(data.iucn),
    nationalCategory: text(data.nationalCategory),
    cites: text(data.cites),
    threatened: data.threatened === true,
    endemic: data.endemic === true,
    emblematic: data.emblematic === true,
    figure: figureOf({ family: text(data.family), genus: text(data.genus) }),
  };
}

const finishOf = (value: unknown) => CARD_CATEGORIES.find((c) => c === value) ?? null;
const count = (value: unknown) => (typeof value === 'number' ? value : 0);

export function toSticker(speciesId: string, data: Record<string, unknown>): Sticker {
  const unlocked = (Array.isArray(data.unlocked) ? data.unlocked : []) as { finish?: unknown; source?: unknown; at?: unknown }[];
  return {
    speciesId,
    completedAt: toDate(data.completedAt),
    validPhotos: count(data.validPhotos),
    observations: count(data.observations),
    countedDays: Array.isArray(data.countedDays) ? data.countedDays.map(Number) : [],
    serverDay: typeof data.serverDay === 'number' ? data.serverDay : null,
    serverCount: count(data.serverCount),
    best: finishOf(data.best),
    ownBest: finishOf(data.ownBest),
    claimedMilestone: count(data.claimedMilestone),
    unlocked: unlocked.flatMap(({ finish, source, at }) => {
      const known = finishOf(finish);
      const origin = FINISH_SOURCES.find((s) => s === source);
      return known && origin ? [{ finish: known, source: origin, at: toDate(at) }] : [];
    }),
  };
}

/** El saldo de users/{uid}/economy/wallet; sin documento, todo en cero. */
export function toWallet(data: Record<string, unknown> | undefined): Wallet {
  return {
    feathers: count(data?.feathers),
    packSpecies: Array.isArray(data?.packSpecies) ? data.packSpecies.map(String) : [],
    premiumMonth: typeof data?.premiumMonth === 'number' ? data.premiumMonth : null,
  };
}

export const walletDocument = ({ feathers, packSpecies, premiumMonth }: Wallet) => ({ feathers, packSpecies, premiumMonth });

export const toPieceCounts = (data: Record<string, unknown>): PieceCounts => ({
  silver: count(data.silver),
  gold: count(data.gold),
  ruby: count(data.ruby),
  diamond: count(data.diamond),
});

export const piecesDocument = (counts: PieceCounts) => Object.fromEntries(PIECE_FINISHES.map((finish) => [finish, counts[finish]]));

/** Un sobre sin abrir: lo que trae se decide al abrirlo. */
export const packDocument = (speciesIds: readonly string[], design: PackDesign, at: Date) => ({
  speciesIds,
  design,
  createdAt: Timestamp.fromDate(at),
  opened: false,
  opening: null,
});

export const openingDocument = ({ speciesId, finish, upgraded, at }: PackOpening) => ({ speciesId, finish, upgraded, at: Timestamp.fromDate(at) });

/** Un sticker como documento de users/{uid}/stickers/{speciesId}. */
export function stickerDocument(sticker: Sticker) {
  return {
    completedAt: Timestamp.fromDate(sticker.completedAt),
    validPhotos: sticker.validPhotos,
    observations: sticker.observations,
    countedDays: sticker.countedDays,
    serverDay: sticker.serverDay,
    serverCount: sticker.serverCount,
    best: sticker.best,
    ownBest: sticker.ownBest,
    claimedMilestone: sticker.claimedMilestone,
    unlocked: sticker.unlocked.map(({ finish, source, at }) => ({ finish, source, at: Timestamp.fromDate(at) })),
  };
}
