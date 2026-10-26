import { getApp } from '@react-native-firebase/app';
import { initializeAppCheck, ReactNativeFirebaseAppCheckProvider } from '@react-native-firebase/app-check';

// App Check: cada pedido a Firebase (Firestore, Storage, Functions) lleva una prueba de que viene de
// esta app instalada desde la tienda (Play Integrity en Android, App Attest en iOS), así nadie
// puede usar la base o la IA desde un script con la configuración de la app. En las builds de
// desarrollo va el proveedor de depuración: su token se registra en la consola (ver
// docs/environment.md). Mientras la consola no lo exija, los pedidos sin prueba siguen pasando.

let started: Promise<unknown> | null = null;

/** Se llama antes de cualquier pedido al proyecto real; con los emuladores no hace falta. */
export function startAppCheck() {
  started ??= (async () => {
    const provider = new ReactNativeFirebaseAppCheckProvider();
    provider.configure({
      android: { provider: __DEV__ ? 'debug' : 'playIntegrity' },
      apple: { provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback' },
    });
    return initializeAppCheck(getApp(), { provider, isTokenAutoRefreshEnabled: true });
  })().catch((error: unknown) => console.warn('App Check no arrancó', error));
  return started;
}
