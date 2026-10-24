import type { Habitat } from './habitat';

export type SpeciesId = string;
/** Cada región es un álbum con sus propias aves (RegionMapa). Hoy solo existe Ica. */
export type RegionId = string;

export type Species = {
  id: SpeciesId;
  regionId: RegionId;
  /** Número del sticker en el álbum de la región («011»). */
  number: number;
  commonName: string;
  scientificName: string;
  habitat: Habitat;
  /** Si está amenazada, su ubicación se oculta siempre, también al compartir (PerfilPrivacidad). */
  threatened: boolean;
};
