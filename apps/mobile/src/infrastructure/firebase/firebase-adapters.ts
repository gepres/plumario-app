import { createFirebaseAuthService } from './firebase-auth-service';
import { connectFirebase } from './firebase-services';
import { createFirestoreSpeciesCatalog } from './firestore-species-catalog';
import { createFirestoreStickerRepository } from './firestore-sticker-repository';
import { createFirestoreUserProfileRepository } from './firestore-user-profile-repository';

/** Todos los adaptadores de Firebase juntos: la raíz de composición carga este módulo solo si los usa. */
export async function createFirebaseAdapters({ emulatorHost }: { emulatorHost?: string }) {
  const services = await connectFirebase({ emulatorHost });
  return {
    auth: createFirebaseAuthService(services),
    catalog: createFirestoreSpeciesCatalog(services),
    stickers: createFirestoreStickerRepository(services),
    profiles: createFirestoreUserProfileRepository(services),
  };
}
