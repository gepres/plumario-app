import { createFileSightingQueue } from '../device/file-sighting-queue';
import { createFirebaseAuthService } from './firebase-auth-service';
import { createFirestoreAchievementRepository } from './firestore-achievement-repository';
import { createFirestoreFeedbackRepository } from './firestore-feedback-repository';
import { createFirebasePhotoStorage } from './firebase-photo-storage';
import { createFirebasePushNotifications } from './firebase-push-notifications';
import { connectFirebase } from './firebase-services';
import { createFirestorePosterRepository } from './firestore-poster-repository';
import { createFirestoreSightingRepository } from './firestore-sighting-repository';
import { createFirestoreSpeciesCatalog } from './firestore-species-catalog';
import { createFirestoreStickerRepository } from './firestore-sticker-repository';
import { createFirestoreTradeRepository } from './firestore-trade-repository';
import { createFirestoreUserProfileRepository } from './firestore-user-profile-repository';
import { createFunctionsSpeciesIdentifier } from './functions-species-identifier';

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
    trades: createFirestoreTradeRepository(services),
    feedback: createFirestoreFeedbackRepository(services),
    queue: createFileSightingQueue(),
    // Gemini, en las Functions suggestSpecies y checkPhoto; al guardar, el servidor revisa otra vez.
    identifier: createFunctionsSpeciesIdentifier(services),
    push: createFirebasePushNotifications(services),
  };
}
