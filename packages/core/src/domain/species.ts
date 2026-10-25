import type { Figure } from './figure';
import type { Habitat } from './habitat';

export type SpeciesId = string;
/** Cada región es un álbum con sus propias aves (RegionMapa). Hoy solo existe Ica. */
export type RegionId = string;

/** El catálogo de Ica trae aves, mamíferos y reptiles; el álbum es solo de aves. */
export type TaxonClass = 'bird' | 'mammal' | 'reptile';

export type Species = {
  id: SpeciesId;
  regionId: RegionId;
  taxonClass: TaxonClass;
  /** Número del sticker en el álbum de la región («011»); null si no entra al álbum. */
  albumNumber: number | null;
  commonName: string;
  scientificName: string;
  /** Hábitat principal en el álbum; null mientras no esté asignado. */
  habitat: Habitat | null;
  /** Categoría global de la Lista Roja de la UICN (LC, NT, VU, EN, CR…); decide el acabado del cromo. */
  iucn: string | null;
  /** Si está amenazada, su ubicación se oculta siempre, también al compartir (PerfilPrivacidad). */
  threatened: boolean;
  endemic: boolean;
  /** Símbolo de Ica o del Perú (lista editorial del diseño): cromo Rubí. */
  emblematic: boolean;
  /** Figura de su grupo (figureOf), para el sticker y la sombra. */
  figure: Figure;
};
