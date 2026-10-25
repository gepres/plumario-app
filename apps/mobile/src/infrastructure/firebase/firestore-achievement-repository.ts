import { Timestamp, collection, doc, getDocs, onSnapshot, query, updateDoc, where } from '@react-native-firebase/firestore';

import { HABITATS, type Achievement, type AchievementRepository, type EarnedAchievement } from '@plumario/core';

import type { FirebaseServices } from './firebase-services';

// Adaptador de Firestore del puerto AchievementRepository: users/{uid}/achievements/{id}. Los escribe
// la Cloud Function al validar una foto; la app solo cambia `seen` (lo único que permiten las reglas).

function toAchievement(data: Record<string, unknown>): Achievement | null {
  switch (data.kind) {
    case 'firstBird':
    case 'explorer':
    case 'albumComplete':
      return { kind: data.kind };
    case 'milestone':
      return typeof data.species === 'number' ? { kind: 'milestone', species: data.species } : null;
    case 'habitatComplete': {
      const habitat = HABITATS.find((h) => h === data.habitat);
      return habitat ? { kind: 'habitatComplete', habitat } : null;
    }
    default:
      return null;
  }
}

function toEarned(id: string, data: Record<string, unknown>): EarnedAchievement | null {
  const achievement = toAchievement(data);
  if (!achievement) return null;
  return { id, achievement, earnedAt: data.earnedAt instanceof Timestamp ? data.earnedAt.toDate() : new Date(0), seen: data.seen === true };
}

const present = (a: EarnedAchievement | null): a is EarnedAchievement => a !== null;

export function createFirestoreAchievementRepository({ db }: FirebaseServices): AchievementRepository {
  const achievements = (userId: string) => collection(db, 'users', userId, 'achievements');
  return {
    async listByUser(userId) {
      const snapshot = await getDocs(achievements(userId));
      return snapshot.docs.map((d) => toEarned(d.id, d.data())).filter(present);
    },
    watchUnseen(userId, listener) {
      return onSnapshot(query(achievements(userId), where('seen', '==', false)), {
        next: (snapshot) => listener(snapshot.docs.map((d) => toEarned(d.id, d.data())).filter(present)),
        error: () => listener([]),
      });
    },
    async markSeen(userId, achievementId) {
      await updateDoc(doc(achievements(userId), achievementId), { seen: true });
    },
  };
}
