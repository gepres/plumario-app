import { getDownloadURL, putFile, ref } from '@react-native-firebase/storage';

import type { PhotoStorage } from '@plumario/core';

import type { FirebaseServices } from './firebase-services';

// Adaptador de Cloud Storage del puerto PhotoStorage: users/{uid}/photos/{nombre}. Las reglas
// (firebase/storage.rules) solo dejan al dueño, y solo imágenes de menos de 10 MB.

export function createFirebasePhotoStorage({ storage }: FirebaseServices): PhotoStorage {
  return {
    async upload(userId, localUri, name) {
      const path = `users/${userId}/photos/${name}`;
      await putFile(ref(storage, path), localUri, { contentType: 'image/jpeg' });
      return path;
    },
    urlFor: (path) => getDownloadURL(ref(storage, path)),
  };
}
