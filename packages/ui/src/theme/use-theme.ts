import { useColorScheme } from 'react-native';

import { shadows, themes, type ColorMode, type Theme } from '@plumario/tokens';

/** Colores de la paleta F según el modo del sistema. */
export function useTheme(): { mode: ColorMode; colors: Theme; shadows: (typeof shadows)[ColorMode] } {
  const mode: ColorMode = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { mode, colors: themes[mode], shadows: shadows[mode] };
}

// Claves de texto del tema que no son colores.
type NotAColor = 'cardShadow';

/** Las claves del tema que son un color plano, para las props que aceptan un color del tema. */
export type ColorToken = Exclude<{ [K in keyof Theme]: Theme[K] extends string ? K : never }[keyof Theme], NotAColor>;
