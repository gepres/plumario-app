import { CHROME_CHANCE, PHOTOS_FOR_CHROME } from './card';
import type { SpeciesId } from './species';

// Un sticker por especie y por usuario (design/project/SistemaStickers.dc.html): en sombra mientras no
// la registra, normal al completarlo con la primera foto validada, y cromado por tres vías.

export type ChromeSource = 'luck' | 'photos' | 'trade';

export type Sticker = {
  speciesId: SpeciesId;
  /** La primera foto validada completa el sticker. */
  completedAt: Date;
  /** Fotos validadas de la especie; las siguientes a la primera van a su galería. */
  validPhotos: number;
  chrome: { source: ChromeSource; at: Date } | null;
};

export type PhotoOutcome = {
  sticker: Sticker;
  /** Esta foto completó el sticker (especie nueva en el álbum). */
  completed: boolean;
  /** Esta foto lo dejó cromado, y por qué vía. */
  chromed: ChromeSource | null;
};

/**
 * Aplica una foto validada al sticker de su especie. `roll` es un número en [0, 1) que decide el cromo
 * al azar al completar; se recibe de fuera para que la regla sea determinista y se pueda probar.
 */
export function applyValidPhoto(current: Sticker | null, speciesId: SpeciesId, at: Date, roll: number): PhotoOutcome {
  if (!current) {
    const luck = roll < CHROME_CHANCE;
    return {
      sticker: { speciesId, completedAt: at, validPhotos: 1, chrome: luck ? { source: 'luck', at } : null },
      completed: true,
      chromed: luck ? 'luck' : null,
    };
  }
  const validPhotos = current.validPhotos + 1;
  const byPhotos = !current.chrome && validPhotos >= PHOTOS_FOR_CHROME;
  return {
    sticker: { ...current, validPhotos, chrome: byPhotos ? { source: 'photos', at } : current.chrome },
    completed: false,
    chromed: byPhotos ? 'photos' : null,
  };
}

/** Fotos que faltan para el cromo por fotos; 0 si ya está cromado. */
export function photosToChrome(sticker: Sticker): number {
  return sticker.chrome ? 0 : Math.max(PHOTOS_FOR_CHROME - sticker.validPhotos, 0);
}
