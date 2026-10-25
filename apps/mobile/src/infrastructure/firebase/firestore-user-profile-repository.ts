import { Timestamp, doc, getDoc, serverTimestamp, updateDoc, writeBatch } from '@react-native-firebase/firestore';

import { DEFAULT_PRIVACY, HandleTakenError, type AlbumVisibility, type UserProfile, type UserProfileRepository } from '@plumario/core';

import { firebaseErrorCode, type FirebaseServices } from './firebase-services';

// Adaptador de Firestore del puerto UserProfileRepository: users/{uid} y la reserva del @usuario en
// handles/{handle}. Las reglas solo dejan crear el perfil si la reserva es de quien lo crea y va en
// la misma escritura, así que dos personas no pueden quedarse con el mismo @usuario.

const VISIBILITIES: readonly AlbumVisibility[] = ['private', 'link', 'public'];
const toDate = (value: unknown) => (value instanceof Timestamp ? value.toDate() : null);

// Los perfiles creados antes no traen los campos nuevos: van con los valores por omisión.
function toProfile(data: Record<string, unknown>): UserProfile {
  const privacy = (data.privacy ?? {}) as Record<string, unknown>;
  return {
    displayName: String(data.displayName ?? ''),
    handle: String(data.handle ?? ''),
    regionId: String(data.regionId ?? 'ica'),
    favoriteSpeciesId: typeof data.favoriteSpeciesId === 'string' ? data.favoriteSpeciesId : null,
    privacy: {
      saveLocation: privacy.saveLocation === true,
      albumVisibility: VISIBILITIES.find((v) => v === privacy.albumVisibility) ?? DEFAULT_PRIVACY.albumVisibility,
      showName: typeof privacy.showName === 'boolean' ? privacy.showName : DEFAULT_PRIVACY.showName,
      improveAi: privacy.improveAi === true,
    },
    handleChangedAt: toDate(data.handleChangedAt),
    regionAlerts: Array.isArray(data.regionAlerts) ? data.regionAlerts.map(String) : [],
    createdAt: toDate(data.createdAt) ?? new Date(0),
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
      batch.set(doc(db, 'users', userId), { ...profile, handleChangedAt: null, createdAt });
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

    async update(userId, changes) {
      await updateDoc(doc(db, 'users', userId), changes);
    },

    async changeHandle(userId, from, to) {
      // Reserva el nuevo, libera el anterior y cambia el perfil en una sola escritura; la fecha la pone
      // el servidor (las reglas la comparan con la hora de la escritura).
      const batch = writeBatch(db);
      batch.set(doc(db, 'handles', to), { uid: userId, createdAt: serverTimestamp() });
      batch.delete(doc(db, 'handles', from));
      batch.update(doc(db, 'users', userId), { handle: to, handleChangedAt: serverTimestamp() });
      try {
        await batch.commit();
      } catch (error) {
        if (firebaseErrorCode(error) !== 'firestore/permission-denied') throw error;
        const owner = (await getDoc(doc(db, 'handles', to))).data()?.uid;
        if (owner && owner !== userId) throw new HandleTakenError(to);
        throw error;
      }
    },
  };
}
