import { Timestamp, collection, getDocs } from '@react-native-firebase/firestore';

import { CATEGORY_RANK, type CardCategory, type FinishSource, type Sticker, type StickerRepository } from '@plumario/core';

import type { FirebaseServices } from './firebase-services';

// Adaptador de Firestore del puerto StickerRepository: users/{uid}/stickers/{speciesId}. Los escribe
// el servidor al validar cada foto; la app solo los lee.

const CARD_CATEGORIES = Object.keys(CATEGORY_RANK) as CardCategory[];
const FINISH_SOURCES: readonly FinishSource[] = ['luck', 'milestone', 'pack', 'purchase', 'trade'];

const toDate = (value: unknown) => (value instanceof Timestamp ? value.toDate() : new Date(0));
const finishOf = (value: unknown) => CARD_CATEGORIES.find((c) => c === value) ?? null;
const count = (value: unknown) => (typeof value === 'number' ? value : 0);

function toSticker(speciesId: string, data: Record<string, unknown>): Sticker {
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

export function createFirestoreStickerRepository({ db }: FirebaseServices): StickerRepository {
  return {
    async listByUser(userId) {
      const snapshot = await getDocs(collection(db, 'users', userId, 'stickers'));
      return snapshot.docs.map((d) => toSticker(d.id, d.data()));
    },
  };
}
