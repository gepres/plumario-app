// Dominio: reglas puras del álbum.
export { HABITATS } from './domain/habitat';
export type { Habitat } from './domain/habitat';
export type { RegionId, Species, SpeciesId, TaxonClass } from './domain/species';
export type { Sighting, SightingStatus, UserId } from './domain/sighting';
export { ALBUM_CLASS, SPECIES_PER_POSTER, isInAlbum, nextPoster, summarizeAlbum } from './domain/album';
export type { AlbumSummary, HabitatProgress, NextPoster } from './domain/album';
export { CATEGORY_RANK, CHROME_CHANCE, PHOTOS_FOR_CHROME, categoryOf, isFairTrade } from './domain/card';
export type { CardCategory } from './domain/card';
export { applyValidPhoto, photosToChrome } from './domain/sticker';
export type { ChromeSource, PhotoOutcome, Sticker } from './domain/sticker';
export { EXPLORER_SPECIES, MILESTONE_STEP, achievementId, earnedAchievements, newAchievements, nextMilestone } from './domain/achievements';
export type { Achievement } from './domain/achievements';
export { isHabitatPosterUnlocked, pickPosterSpecies, speciesPostersAvailable } from './domain/posters';
export { applyTrade, tradeProblem } from './domain/trade';
export type { TradeProblem, TradeSide } from './domain/trade';

// Puertos: lo que el núcleo necesita del mundo y cada plataforma implementa con un adaptador.
export type { PhotoStorage } from './application/ports/photo-storage';
export type { SightingRepository } from './application/ports/sighting-repository';
export type { SpeciesCatalog } from './application/ports/species-catalog';
export type { SpeciesIdentifier, SpeciesSuggestion } from './application/ports/species-identifier';
export type { StickerRepository } from './application/ports/sticker-repository';

// Casos de uso.
export { makeGetAlbumSummary } from './application/use-cases/get-album-summary';
export type { GetAlbumSummary } from './application/use-cases/get-album-summary';
export { evaluateValidatedPhoto } from './application/use-cases/evaluate-validated-photo';
export type { ValidatedPhotoResult } from './application/use-cases/evaluate-validated-photo';
