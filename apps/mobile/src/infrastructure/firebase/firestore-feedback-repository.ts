import { Timestamp, addDoc, collection } from '@react-native-firebase/firestore';

import type { FeedbackRepository } from '@plumario/core';

import type { FirebaseServices } from './firebase-services';

// Adaptador de Firestore del puerto FeedbackRepository: feedback/{id}. Solo se crean; el equipo los
// lee desde la consola.
export function createFirestoreFeedbackRepository({ db }: FirebaseServices): FeedbackRepository {
  return {
    async send(feedback) {
      await addDoc(collection(db, 'feedback'), { ...feedback, createdAt: Timestamp.fromDate(feedback.createdAt) });
    },
  };
}
