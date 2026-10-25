import { Timestamp, addDoc, collection, getDocs } from '@react-native-firebase/firestore';

import { HABITATS, type PosterRepository, type SavedPoster } from '@plumario/core';

import type { FirebaseServices } from './firebase-services';

// Adaptador de Firestore del puerto PosterRepository: users/{uid}/posters/{id}. Los escribe el dueño
// (firestore.rules: validPoster) y quedan fijos.

function toPoster(id: string, data: Record<string, unknown>): SavedPoster {
  return {
    id,
    kind: data.kind === 'habitat' ? 'habitat' : 'species',
    number: typeof data.number === 'number' ? data.number : null,
    habitat: HABITATS.find((h) => h === data.habitat) ?? null,
    speciesIds: Array.isArray(data.speciesIds) ? data.speciesIds.map(String) : [],
    seed: typeof data.seed === 'number' ? data.seed : 7,
    theme: data.theme === 'dark' ? 'dark' : 'light',
    title: String(data.title ?? ''),
    savedAt: data.savedAt instanceof Timestamp ? data.savedAt.toDate() : new Date(0),
  };
}

export function createFirestorePosterRepository({ db }: FirebaseServices): PosterRepository {
  const posters = (userId: string) => collection(db, 'users', userId, 'posters');
  return {
    async listByUser(userId) {
      const snapshot = await getDocs(posters(userId));
      return snapshot.docs.map((d) => toPoster(d.id, d.data())).sort((a, b) => a.savedAt.getTime() - b.savedAt.getTime());
    },
    async save(userId, poster) {
      const ref = await addDoc(posters(userId), { ...poster, savedAt: Timestamp.fromDate(poster.savedAt) });
      return ref.id;
    },
  };
}
