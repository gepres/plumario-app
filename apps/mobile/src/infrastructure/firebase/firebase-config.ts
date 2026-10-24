import Constants from 'expo-constants';

/**
 * Si esta build lleva los plugins nativos de Firebase (app.config.ts los activa cuando están los
 * archivos de configuración del proyecto). Sin ellos, cualquier llamada a @react-native-firebase
 * falla en ejecución: los adaptadores de Firebase solo se eligen detrás de esta marca.
 */
export const isFirebaseConfigured = Constants.expoConfig?.extra?.firebaseConfigured === true;
