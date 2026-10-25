import { Timestamp, doc, getDoc, writeBatch } from '@react-native-firebase/firestore';

import { HandleTakenError, type UserProfile, type UserProfileRepository } from '@plumario/core';

import { firebaseErrorCode, type FirebaseServices } from './firebase-services';

// Adaptador de Firestore del puerto UserProfileRepository: users/{uid} y la reserva del @usuario en
// handles/{handle}. Las reglas solo dejan crear el perfil si la reserva es de quien lo crea y va en
// la misma escritura, así que dos personas no pueden quedarse con el mismo @usuario.

function toProfile(data: Record<string, unknown>): UserProfile {
  const privacy = (data.privacy ?? {}) as Record<string, unknown>;
  return {
    displayName: String(data.displayName ?? ''),
    handle: String(data.handle ?? ''),
    regionId: String(data.regionId ?? 'ica'),
    privacy: { saveLocation: privacy.saveLocation === true, albumVisibility: privacy.albumVisibility === 'public' ? 'public' : 'private' },
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(0),
  };
}

export function createFirestoreUserProfileRepository({ db }: FirebaseServices): UserProfileRepository {
  return {
    async get(userId) {
      const data = (await getDoc(doc(db, 'users', userId))).data();
      return data ? toProfile(data) : null;
    },

    async isHandleAvailable(handle) {
      return !(await getDoc(doc(db, 'handles', handle))).exists();
    },

    async create(userId, profile) {
      const createdAt = Timestamp.fromDate(profile.createdAt);
      const batch = writeBatch(db);
      batch.set(doc(db, 'handles', profile.handle), { uid: userId, createdAt });
      batch.set(doc(db, 'users', userId), { ...profile, createdAt });
      try {
        await batch.commit();
      } catch (error) {
        // Si la reserva ya existe, la escritura cuenta como cambiarla y las reglas la niegan.
        if (firebaseErrorCode(error) !== 'firestore/permission-denied') throw error;
        const owner = (await getDoc(doc(db, 'handles', profile.handle))).data()?.uid;
        if (owner && owner !== userId) throw new HandleTakenError(profile.handle);
        throw error;
      }
    },
  };
}
