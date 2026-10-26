import type { Appearance } from '@plumario/core';

/** Cómo se nombra cada apariencia en Perfil › Ajustes y en Perfil › Apariencia. */
export const APPEARANCE_LABELS: Record<Appearance, { title: string; detail: string }> = {
  system: { title: 'Automático', detail: 'Como tu teléfono: cambia solo si él cambia' },
  light: { title: 'Claro', detail: 'Fondo blanco, se lee mejor a pleno sol' },
  dark: { title: 'Oscuro', detail: 'Fondo oscuro, cansa menos de noche' },
};
