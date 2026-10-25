import { useSyncExternalStore } from 'react';

// Cuándo hay que volver a pedir el álbum: lo cambian registrar un ave o un intercambio, y lo
// escuchan Inicio, Álbum, los hábitats y la galería.

let version = 0;
const listeners = new Set<() => void>();

export function invalidateAlbum() {
  version += 1;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAlbumVersion(): number {
  return useSyncExternalStore(subscribe, () => version);
}
