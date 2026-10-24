import { HABITATS, type Habitat } from './habitat';
import type { Sighting } from './sighting';
import type { Species, TaxonClass } from './species';

/** El álbum es de aves: mamíferos y reptiles están en el catálogo, pero no cuentan («Álbum de aves»). */
export const ALBUM_CLASS: TaxonClass = 'bird';

/** «Cada 10 especies se arma un póster con tus aves» (Inicio). */
export const SPECIES_PER_POSTER = 10;

export const isInAlbum = (species: Species) => species.taxonClass === ALBUM_CLASS;

export type HabitatProgress = { habitat: Habitat; registered: number; total: number };

export type NextPoster = { number: number; remaining: number };

export type AlbumSummary = {
  /** Especies distintas registradas: fotografiar dos veces la misma ave no suma. */
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

/** Avance del álbum de una región. No cuentan las especies fuera del álbum ni fuera del catálogo. */
export function summarizeAlbum(catalog: readonly Species[], sightings: readonly Sighting[]): AlbumSummary {
  const album = catalog.filter(isInAlbum);
  const speciesById = new Map(album.map((species) => [species.id, species]));
  const registered = new Set(sightings.map((s) => s.speciesId).filter((id) => speciesById.has(id)));
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
