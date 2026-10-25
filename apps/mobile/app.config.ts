// Este archivo corre en Node (lo evalúa la CLI de Expo), no en el teléfono.
/// <reference types="node" />
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

// Colores de arranque, de la paleta F (packages/tokens): fondo claro y oscuro, y el verde del ícono.
const LIGHT_BACKGROUND = '#FFFFFF';
const DARK_BACKGROUND = '#101311';
const ICON_GREEN = '#3E6A2B';

// Los archivos de configuración de Firebase se descargan de la consola del proyecto y no se
// versionan. En EAS llegan como variables de entorno de tipo archivo (ver docs/environment.md).
// Los plugins de React Native Firebase se registran para las dos plataformas a la vez y fallan
// al hacer prebuild de una sin su archivo, así que solo se activan con los dos: sin proyecto de
// Firebase (o con uno solo de los archivos), la app compila y arranca sin Firebase.
function existingFile(fromEnv: string | undefined, fallback: string) {
  const path = fromEnv ?? fallback;
  return existsSync(resolve(__dirname, path)) ? path : undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesAndroid = existingFile(process.env.GOOGLE_SERVICES_JSON, './firebase/google-services.json');
  const googleServicesIos = existingFile(process.env.GOOGLE_SERVICES_PLIST, './firebase/GoogleService-Info.plist');
  const firebase = Boolean(googleServicesAndroid && googleServicesIos);
  if (Boolean(googleServicesAndroid) !== Boolean(googleServicesIos)) {
    const missing = googleServicesAndroid ? 'GoogleService-Info.plist (iOS)' : 'google-services.json (Android)';
    console.warn(`Firebase queda desactivado en esta build: falta ${missing} en apps/mobile/firebase/.`);
  }

  return {
    ...config,
    name: 'Plumario',
    slug: 'plumario',
    version: '0.1.0',
    orientation: 'portrait',
    scheme: 'plumario',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: 'com.gepres.plumario',
      supportsTablet: false,
      googleServicesFile: googleServicesIos,
    },
    android: {
      package: 'com.gepres.plumario',
      adaptiveIcon: {
        backgroundColor: ICON_GREEN,
        foregroundImage: './assets/images/android-icon-foreground.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      googleServicesFile: googleServicesAndroid,
    },
    web: {
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 120,
          backgroundColor: LIGHT_BACKGROUND,
          dark: { image: './assets/images/splash-icon.png', backgroundColor: DARK_BACKGROUND },
        },
      ],
      // iOS: Firebase Apple SDK 13+ solo se distribuye por SPM y exige frameworks dinámicos.
      // Android: el SDK de Firebase que trae React Native Firebase 27 está compilado con Kotlin 2.4,
      // y con el 2.2 de Expo falla al compilar («incompatible version of Kotlin … expected 2.2.0»).
      ['expo-build-properties', { ios: { useFrameworks: 'dynamic' }, android: { kotlinVersion: '2.4.0' } }],
      ...(firebase ? ['@react-native-firebase/app', '@react-native-firebase/auth'] : []),
      // Registrar un ave (cámara y galería), pósteres (guardar y compartir) e intercambios (QR).
      [
        'expo-camera',
        {
          cameraPermission: 'Plumario usa la cámara para que fotografíes las aves que ves y para leer el código de un intercambio.',
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Plumario abre tus fotos para que elijas la de un ave que ya fotografiaste.',
          cameraPermission: 'Plumario usa la cámara para que fotografíes las aves que ves.',
          microphonePermission: false,
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission: 'Plumario guarda tus pósteres en tus fotos.',
          savePhotosPermission: 'Plumario guarda tus pósteres en tus fotos.',
          isAccessMediaLocationEnabled: false,
        },
      ],
      'expo-sharing',
      // Windows: CMake con ninja que admite rutas largas (ver el plugin).
      './plugins/with-windows-cmake',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      ...config.extra,
      firebaseConfigured: firebase,
    },
  };
};
