import { useSyncExternalStore } from 'react';

import type { Appearance } from '@plumario/core';

import { useDependencies } from '@/infrastructure/dependencies';

/** La apariencia elegida (Perfil › Apariencia) y cómo cambiarla; se actualiza al cambiarla. */
export function useAppearance(): [Appearance, (value: Appearance) => void] {
  const { appearance } = useDependencies();
  return [useSyncExternalStore(appearance.subscribe, appearance.current), appearance.set];
}
