/**
 * Cómo se ve la app (Perfil › Apariencia): como el teléfono, o siempre clara u oscura. No está en el
 * diseño; lo pidió el usuario. Es del teléfono, no de la cuenta: cada dispositivo guarda la suya.
 */
export type Appearance = 'system' | 'light' | 'dark';

export const APPEARANCES: readonly Appearance[] = ['system', 'light', 'dark'];

/** Lo que se lee de lo guardado; si no es una apariencia conocida, la del teléfono. */
export function parseAppearance(value: unknown): Appearance {
  return APPEARANCES.find((a) => a === value) ?? 'system';
}
