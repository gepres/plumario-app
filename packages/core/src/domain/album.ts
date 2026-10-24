import { HABITATS, type Habitat } from './habitat';
import type { Sighting } from './sighting';
import type { Species } from './species';

/** «Cada 10 especies se arma un póster con tus aves» (Inicio). */
export const SPECIES_PER_POSTER = 10;

export type HabitatProgress = { habitat: Habitat; registered: number; total: number };

export type NextPoster = { number: number; remaining: number };

export type AlbumSummary = {
  /** Especies distintas registradas: fotografiar dos veces la misma ave no suma. */
  registered: number;
  total: number;
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

/** Avance del álbum de una región. Los registros de especies fuera del catálogo no cuentan. */
export function summarizeAlbum(catalog: readonly Species[], sightings: readonly Sighting[]): AlbumSummary {
  const speciesById = new Map(catalog.map((species) => [species.id, species]));
  const registered = new Set(sightings.map((s) => s.speciesId).filter((id) => speciesById.has(id)));
  const byHabitat = HABITATS.map((habitat) => ({
    habitat,
    total: catalog.filter((species) => species.habitat === habitat).length,
    registered: [...registered].filter((id) => speciesById.get(id)?.habitat === habitat).length,
  }));
  return {
    registered: registered.size,
    total: catalog.length,
    byHabitat,
    nextPoster: nextPoster(registered.size, catalog.length),
  };
}
