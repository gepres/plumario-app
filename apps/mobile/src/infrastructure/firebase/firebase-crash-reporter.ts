import { getApp } from '@react-native-firebase/app';
import { getCrashlytics, recordError, setUserId } from '@react-native-firebase/crashlytics';

import type { ErrorReporter } from '@plumario/core';

// Adaptador de Crashlytics del puerto ErrorReporter. Los cierres inesperados (nativos y de
// JavaScript) los recoge Crashlytics solo; en las builds de desarrollo no manda nada.

export function createCrashlyticsReporter(): ErrorReporter {
  const crashlytics = getCrashlytics(getApp());
  return {
    // Sin sesión, una cadena vacía: Crashlytics no tiene cómo borrar el usuario.
    setUser: (userId) => void setUserId(crashlytics, userId ?? '').catch(() => undefined),
    record: (error, context) => recordError(crashlytics, error instanceof Error ? error : new Error(String(error)), context),
  };
}
