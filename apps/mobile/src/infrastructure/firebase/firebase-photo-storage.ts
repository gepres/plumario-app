import { getDownloadURL, putFile, ref, setMaxUploadRetryTime } from '@react-native-firebase/storage';

import { NetworkError, type PhotoStorage } from '@plumario/core';

import { firebaseErrorCode, type FirebaseServices } from './firebase-services';

// Adaptador de Cloud Storage del puerto PhotoStorage: users/{uid}/photos/{nombre}. Las reglas
// (firebase/storage.rules) solo dejan al dueño, y solo imágenes de menos de 10 MB.

/**
 * Cuánto se insiste en subir sin conexión. Por omisión Firebase reintenta 10 minutos; con poco se
 * avisa enseguida y el registro pasa a la cola del teléfono («Registrar sin señal»).
 */
const UPLOAD_RETRY_MS = 12_000;

/** Sin señal, Storage termina con uno de estos, o con un error de red sin código propio. */
function isNetworkFailure(error: unknown): boolean {
  const code = firebaseErrorCode(error);
  if (code === 'storage/retry-limit-exceeded') return true;
  const message = error instanceof Error ? error.message : String(error);
  return code === 'storage/unknown' && /network|host|connect|timed? ?out|unreachable/i.test(message);
}

export function createFirebasePhotoStorage({ storage }: FirebaseServices): PhotoStorage {
  void setMaxUploadRetryTime(storage, UPLOAD_RETRY_MS).catch(() => undefined);
  return {
    async upload(userId, localUri, name) {
      const path = `users/${userId}/photos/${name}`;
      try {
        await putFile(ref(storage, path), localUri, { contentType: 'image/jpeg' });
      } catch (error) {
        throw isNetworkFailure(error) ? new NetworkError(String(error)) : error;
      }
      return path;
    },
    urlFor: (path) => getDownloadURL(ref(storage, path)),
  };
}
