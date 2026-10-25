import { createVersionStore } from './version-store';

// Cuándo hay que volver a pedir el álbum: lo cambian registrar un ave o un intercambio, y lo
// escuchan Inicio, Álbum, los hábitats y la galería.

const album = createVersionStore();

export const invalidateAlbum = album.invalidate;

export function useAlbumVersion(): number {
  return album.useVersion();
}
