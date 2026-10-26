import { getApp, getApps, initializeApp } from '@react-native-firebase/app';
import { connectAuthEmulator, getAuth } from '@react-native-firebase/auth';
import { connectFirestoreEmulator, getFirestore } from '@react-native-firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from '@react-native-firebase/functions';
import { connectStorageEmulator, getStorage } from '@react-native-firebase/storage';

// Las instancias de Firebase que usan los adaptadores.
//
// Con `emulatorHost`, todo va a los emuladores locales (pnpm emulators) y con el proyecto
// demo-plumario: los emuladores separan datos, reglas y triggers por proyecto, y corren con ese. La
// app nativa trae el proyecto real en google-services.json, así que se crea una app secundaria con
// las mismas credenciales y el proyecto de demo; un proyecto demo- nunca sale a la nube.

export const EMULATOR_PROJECT_ID = 'demo-plumario';
const EMULATOR_APP_NAME = 'emulator';
const PORTS = { firestore: 8080, auth: 9099, storage: 9199, functions: 5001 } as const;
/** Donde corren las Functions: la misma región que functions/src/health.ts (REGION). */
export const FUNCTIONS_REGION = 'southamerica-west1';

// Conectar a un emulador solo se puede una vez y antes de cualquier lectura; con la recarga en
// caliente, la raíz de composición puede crearse de nuevo.
let connected = false;

export type FirebaseServices = {
  db: ReturnType<typeof getFirestore>;
  auth: ReturnType<typeof getAuth>;
  storage: ReturnType<typeof getStorage>;
  functions: ReturnType<typeof getFunctions>;
};

export async function connectFirebase({ emulatorHost }: { emulatorHost?: string } = {}): Promise<FirebaseServices> {
  if (!emulatorHost) return { db: getFirestore(), auth: getAuth(), storage: getStorage(), functions: getFunctions(getApp(), FUNCTIONS_REGION) };

  const app =
    getApps().find((a) => a.name === EMULATOR_APP_NAME) ??
    (await initializeApp(
      {
        ...getApp().options,
        projectId: EMULATOR_PROJECT_ID,
        storageBucket: `${EMULATOR_PROJECT_ID}.appspot.com`,
        // No usamos Realtime Database, pero RNFB exige la URL para crear una app secundaria.
        databaseURL: `https://${EMULATOR_PROJECT_ID}-default-rtdb.firebaseio.com`,
      },
      EMULATOR_APP_NAME,
    ));
  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);
  const functions = getFunctions(app, FUNCTIONS_REGION);
  if (!connected) {
    connectFirestoreEmulator(db, emulatorHost, PORTS.firestore);
    connectAuthEmulator(auth, `http://${emulatorHost}:${PORTS.auth}`);
    connectStorageEmulator(storage, emulatorHost, PORTS.storage);
    connectFunctionsEmulator(functions, emulatorHost, PORTS.functions);
    connected = true;
  }
  return { db, auth, storage, functions };
}

/** El código de un error de @react-native-firebase («auth/wrong-password», «firestore/permission-denied»). */
export function firebaseErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
}
