import { HABITATS, type Habitat } from './habitat';
import type { Species, SpeciesId, TaxonClass } from './species';
import type { Sticker } from './sticker';

/** El álbum es de aves: mamíferos y reptiles están en el catálogo, pero no cuentan («Álbum de aves»). */
export const ALBUM_CLASS: TaxonClass = 'bird';

/** «Cada 10 especies se arma un póster con tus aves» (Inicio). */
export const SPECIES_PER_POSTER = 10;

export const isInAlbum = (species: Species) => species.taxonClass === ALBUM_CLASS;

export type HabitatProgress = { habitat: Habitat; registered: number; total: number };

export type NextPoster = { number: number; remaining: number };

export type AlbumSummary = {
  /** Especies del álbum con el sticker completado: se cuentan especies, no fotos. */
  registered: number;
  total: number;
  /** Solo las especies con hábitat asignado; las demás cuentan en el total. */
  byHabitat: HabitatProgress[];
  /** null cuando el catálogo de la región ya no alcanza para otro póster. */
  nextPoster: NextPoster | null;
};

/** El póster N se completa al llegar a N × 10 especies. */
export function nextPoster(registered: number, total: number): NextPoster | null {
  const number = Math.floor(registered / SPECIES_PER_POSTER) + 1;
  const goal = number * SPECIES_PER_POSTER;
  if (goal > total) return null;
  return { number, remaining: goal - registered };
}

/**
 * Avance del álbum de una región a partir de los stickers completados del usuario. No cuentan las
 * especies fuera del álbum (mamíferos, reptiles) ni las que no están en el catálogo de la región.
 */
export function summarizeAlbum(catalog: readonly Species[], stickers: readonly Pick<Sticker, 'speciesId'>[]): AlbumSummary {
  const album = catalog.filter(isInAlbum);
  const speciesById = new Map(album.map((species) => [species.id, species]));
  const registered = new Set<SpeciesId>(stickers.map((s) => s.speciesId).filter((id) => speciesById.has(id)));
  const byHabitat = HABITATS.map((habitat) => ({
    habitat,
    total: album.filter((species) => species.habitat === habitat).length,
    registered: [...registered].filter((id) => speciesById.get(id)?.habitat === habitat).length,
  }));
  return {
    registered: registered.size,
    total: album.length,
    byHabitat,
    nextPoster: nextPoster(registered.size, album.length),
  };
}
