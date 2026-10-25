import { testSpeciesIdentifier } from '../test-species-identifier';
import { createFirebaseAuthService } from './firebase-auth-service';
import { createFirestoreAchievementRepository } from './firestore-achievement-repository';
import { createFirebasePhotoStorage } from './firebase-photo-storage';
import { connectFirebase } from './firebase-services';
import { createFirestorePosterRepository } from './firestore-poster-repository';
import { createFirestoreSightingRepository } from './firestore-sighting-repository';
import { createFirestoreSpeciesCatalog } from './firestore-species-catalog';
import { createFirestoreStickerRepository } from './firestore-sticker-repository';
import { createFirestoreUserProfileRepository } from './firestore-user-profile-repository';

/** Todos los adaptadores de Firebase juntos: la raíz de composición carga este módulo solo si los usa. */
export async function createFirebaseAdapters({ emulatorHost }: { emulatorHost?: string }) {
  const services = await connectFirebase({ emulatorHost });
  return {
    auth: createFirebaseAuthService(services),
    achievements: createFirestoreAchievementRepository(services),
    catalog: createFirestoreSpeciesCatalog(services),
    stickers: createFirestoreStickerRepository(services),
    profiles: createFirestoreUserProfileRepository(services),
    photos: createFirebasePhotoStorage(services),
    posters: createFirestorePosterRepository(services),
    sightings: createFirestoreSightingRepository(services),
    // Hasta elegir el proveedor de IA (PA-12); la validación de verdad la hace el servidor.
    identifier: testSpeciesIdentifier,
  };
}
