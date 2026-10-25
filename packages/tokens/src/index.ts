import { colors } from './colors';
import type { Gradient } from './gradient';

export { colors, designKeyMap, palette } from './colors';
export { fontFamilies, typography } from './typography';
export type { FontFamily, FontWeight, TypeStyle, TypeVariant } from './typography';
export { layout, radius, shadows, spacing } from './layout';
export { cardFinishes, stickerTints } from './card-finishes';
export type { CardCategory, CardFinish } from './card-finishes';
export type { Gradient, GradientStop } from './gradient';

// `colors` se genera con `as const`, así que claro y oscuro tienen tipos literales distintos.
// Theme es la forma común, con los literales abiertos a string/number.
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : { readonly [K in keyof T]: Widen<T[K]> };

type GradientKey = 'hero' | 'reveal' | 'fab';
export type Theme = Omit<Widen<typeof colors.light>, GradientKey> & Record<GradientKey, Gradient>;
export type ColorMode = keyof typeof colors;

/** Los dos modos con la misma forma: si el generador dejara a uno sin una clave, no compila. */
export const themes: Record<ColorMode, Theme> = colors;
