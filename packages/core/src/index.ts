// Dominio: reglas puras del álbum.
export { HABITATS } from './domain/habitat';
export type { Habitat } from './domain/habitat';
export type { RegionId, Species, SpeciesId, TaxonClass } from './domain/species';
export type { Sighting, UserId } from './domain/sighting';
export { ALBUM_CLASS, SPECIES_PER_POSTER, isInAlbum, nextPoster, summarizeAlbum } from './domain/album';
export type { AlbumSummary, HabitatProgress, NextPoster } from './domain/album';

// Puertos: lo que el núcleo necesita del mundo y cada plataforma implementa con un adaptador.
export type { SightingRepository } from './application/ports/sighting-repository';
export type { SpeciesCatalog } from './application/ports/species-catalog';

// Casos de uso.
export { makeGetAlbumSummary } from './application/use-cases/get-album-summary';
export type { GetAlbumSummary } from './application/use-cases/get-album-summary';
