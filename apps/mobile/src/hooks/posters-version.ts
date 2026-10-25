import { createVersionStore } from './version-store';

// Cuándo hay que volver a pedir los pósteres guardados: al guardar uno. No toca el álbum, que es
// lo caro de volver a pedir.

const posters = createVersionStore();

export const invalidatePosters = posters.invalidate;

export function usePostersVersion(): number {
  return posters.useVersion();
}
