import { useSyncExternalStore } from 'react';

/**
 * Un contador que sube cuando algo cambia: quien muestra esos datos escucha la versión y los vuelve
 * a pedir al cambiar (invalidate).
 */
export function createVersionStore() {
  let version = 0;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  return {
    invalidate() {
      version += 1;
      for (const listener of listeners) listener();
    },
    useVersion: () => useSyncExternalStore(subscribe, () => version),
  };
}
