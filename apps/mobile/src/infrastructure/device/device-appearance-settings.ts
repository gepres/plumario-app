import { File, Paths } from 'expo-file-system';
import { Appearance as NativeAppearance, Platform } from 'react-native';

import { parseAppearance, type Appearance, type AppearanceSettings } from '@plumario/core';

// Adaptador del puerto AppearanceSettings: la elección va en documents/appearance.json y se aplica con
// Appearance.setColorScheme, que cambia lo que devuelve useColorScheme() en toda la app (y con eso
// useTheme de @plumario/ui) y también en lo nativo: teclado, diálogos y selectores. «system» quita la
// preferencia y la app vuelve a seguir al teléfono. En web no hay setColorScheme: sigue al navegador.

const file = () => new File(Paths.document, 'appearance.json');

function read(): Appearance {
  try {
    const stored = file();
    return stored.exists ? parseAppearance(JSON.parse(stored.textSync()).appearance) : 'system';
  } catch {
    return 'system';
  }
}

function apply(value: Appearance) {
  if (Platform.OS !== 'web') NativeAppearance.setColorScheme(value === 'system' ? 'auto' : value);
}

/** Lee la elección guardada y la aplica al crearse: se crea al cargar la app, antes del primer cuadro. */
export function createDeviceAppearanceSettings(): AppearanceSettings {
  let current = read();
  apply(current);
  const listeners = new Set<(value: Appearance) => void>();
  return {
    current: () => current,
    set(value) {
      current = value;
      apply(value);
      for (const listener of listeners) listener(value);
      // Si no se puede guardar, igual queda aplicada mientras la app siga abierta.
      try {
        file().write(JSON.stringify({ appearance: value }));
      } catch {}
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
