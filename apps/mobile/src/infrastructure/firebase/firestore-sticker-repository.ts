import { Timestamp, collection, getDocs } from '@react-native-firebase/firestore';

import type { ChromeSource, Sticker, StickerRepository } from '@plumario/core';

import type { FirebaseServices } from './firebase-services';

// Adaptador de Firestore del puerto StickerRepository: users/{uid}/stickers/{speciesId}. Los escribe
// el servidor al validar cada foto; la app solo los lee.

const CHROME_SOURCES: readonly ChromeSource[] = ['luck', 'photos', 'trade'];

const toDate = (value: unknown) => (value instanceof Timestamp ? value.toDate() : new Date(0));

function toSticker(speciesId: string, data: Record<string, unknown>): Sticker {
  const chrome = data.chrome as { source?: unknown; at?: unknown } | null | undefined;
  const source = CHROME_SOURCES.find((s) => s === chrome?.source);
  return {
    speciesId,
    completedAt: toDate(data.completedAt),
    validPhotos: typeof data.validPhotos === 'number' ? data.validPhotos : 1,
    chrome: source ? { source, at: toDate(chrome?.at) } : null,
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
