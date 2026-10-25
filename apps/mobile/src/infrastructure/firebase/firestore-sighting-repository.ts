import { Timestamp, collection, doc, getDocs, onSnapshot, query, setDoc, where } from '@react-native-firebase/firestore';

import type { Sighting, SightingRepository, SightingResult, SightingStatus } from '@plumario/core';

import type { FirebaseServices } from './firebase-services';

// Adaptador de Firestore del puerto SightingRepository: users/{uid}/sightings/{id}. La app crea el
// registro pendiente; la Cloud Function onSightingCreated lo valida y le escribe status y result.

const STATUSES: readonly SightingStatus[] = ['pending', 'validated', 'rejected'];
const toDate = (value: unknown) => (value instanceof Timestamp ? value.toDate() : new Date(0));

function toSighting(userId: string, id: string, data: Record<string, unknown>): Sighting {
  const location = data.location as Sighting['location'];
  return {
    id,
    userId,
    speciesId: String(data.speciesId),
    regionId: String(data.regionId),
    takenAt: toDate(data.takenAt),
    status: STATUSES.find((s) => s === data.status) ?? 'pending',
    photoPath: typeof data.photoPath === 'string' ? data.photoPath : null,
    location: location && typeof location.latitude === 'number' ? location : null,
    placeName: typeof data.placeName === 'string' ? data.placeName : null,
    createdAt: toDate(data.createdAt),
    result: (data.result as SightingResult | undefined) ?? null,
  };
}

export function createFirestoreSightingRepository({ db }: FirebaseServices): SightingRepository {
  const sightings = (userId: string) => collection(db, 'users', userId, 'sightings');
  return {
    newId: (userId) => doc(sightings(userId)).id,

    async add(sighting) {
      // Solo lo que el cliente puede escribir (firestore.rules): ni el estado final ni el resultado.
      await setDoc(doc(sightings(sighting.userId), sighting.id), {
        speciesId: sighting.speciesId,
        regionId: sighting.regionId,
        takenAt: Timestamp.fromDate(sighting.takenAt),
        status: 'pending',
        photoPath: sighting.photoPath,
        location: sighting.location,
        placeName: sighting.placeName,
        createdAt: Timestamp.fromDate(sighting.createdAt),
      });
    },

    watch(userId, sightingId, listener) {
      return onSnapshot(doc(sightings(userId), sightingId), {
        next: (snapshot) => {
          const data = snapshot.data();
          listener(data ? toSighting(userId, snapshot.id, data) : null);
        },
        error: () => listener(null),
      });
    },

    async listBySpecies(userId, speciesId) {
      // Sin orderBy en la consulta para no necesitar un índice compuesto: se ordena acá.
      const snapshot = await getDocs(query(sightings(userId), where('speciesId', '==', speciesId)));
      return snapshot.docs.map((d) => toSighting(userId, d.id, d.data())).sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime());
    },
  };
}
