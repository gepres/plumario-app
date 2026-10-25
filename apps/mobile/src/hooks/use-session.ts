import { useSyncExternalStore } from 'react';

import type { AuthUser } from '@plumario/core';

import { useDependencies } from '@/infrastructure/dependencies';

/** Quién tiene la sesión abierta (null si nadie); se actualiza al entrar y al salir. */
export function useSession(): AuthUser | null {
  const { session } = useDependencies();
  return useSyncExternalStore(session.onChange, session.currentUser);
}
