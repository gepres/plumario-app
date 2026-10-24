import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Si esta build lleva los plugins nativos de Firebase (app.config.ts los activa cuando están los
 * archivos de configuración del proyecto). Sin ellos, cualquier llamada a @react-native-firebase
 * falla en ejecución: los adaptadores de Firebase solo se eligen detrás de esta marca.
 */
export const isFirebaseConfigured = Constants.expoConfig?.extra?.firebaseConfigured === true;

/**
 * De dónde salen los datos (EXPO_PUBLIC_DATA_SOURCE en apps/mobile/.env):
 * - memory: adaptadores en memoria con la muestra del diseño (por omisión, y siempre en web).
 * - emulator: Firestore del emulador local (pnpm emulators + pnpm species:seed).
 * - firebase: el proyecto real.
 * Sin Firebase en la build, o en web (donde no hay módulos nativos), siempre es memory.
 */
export type DataSource = 'memory' | 'emulator' | 'firebase';

const requested = process.env.EXPO_PUBLIC_DATA_SOURCE;

export const dataSource: DataSource =
  isFirebaseConfigured && Platform.OS !== 'web' && (requested === 'emulator' || requested === 'firebase') ? requested : 'memory';

/** Desde el emulador de Android, la máquina anfitriona es 10.0.2.2. */
export const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? '10.0.2.2';
