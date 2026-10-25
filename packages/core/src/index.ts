// Dominio: reglas puras del álbum.
export { HABITATS } from './domain/habitat';
export type { Habitat } from './domain/habitat';
export type { RegionId, Species, SpeciesId, TaxonClass } from './domain/species';
export { PLACE_NAME_MAX } from './domain/sighting';
export type { Sighting, SightingResult, SightingStatus, UserId } from './domain/sighting';
export { ALBUM_CLASS, SPECIES_PER_POSTER, isInAlbum, nextPoster, summarizeAlbum } from './domain/album';
export { buildAlbumView, filterEntries, formatAlbumNumber, habitatPreview, searchEntries, sealsOf } from './domain/album-view';
export type { AlbumEntry, AlbumFilter, AlbumView, HabitatSection, Seal } from './domain/album-view';
export { FIGURES, figureOf } from './domain/figure';
export { CATEGORIES, chromesView, rewardsView, summaryOf } from './domain/rewards';
export type { CategoryProgress, ChromesView, MedalProgress, RewardsView } from './domain/rewards';
export type { Figure } from './domain/figure';
export type { AlbumSummary, HabitatProgress, NextPoster } from './domain/album';
export { CATEGORY_RANK, CHROME_CHANCE, PHOTOS_FOR_CHROME, categoryOf, isFairTrade } from './domain/card';
export type { CardCategory } from './domain/card';
export { applyValidPhoto, photosToChrome } from './domain/sticker';
export type { ChromeSource, PhotoOutcome, Sticker } from './domain/sticker';
export { EXPLORER_SPECIES, MILESTONE_STEP, achievementId, earnedAchievements, newAchievements, nextMilestone } from './domain/achievements';
export type { Achievement } from './domain/achievements';
export { isHabitatPosterUnlocked, pickPosterSpecies, speciesPostersAvailable } from './domain/posters';
export { applyTrade, tradeProblem } from './domain/trade';
export { DEFAULT_REGION_ID, HANDLE_PATTERN, PASSWORD_MIN_LENGTH, handleProblem, isEmailLike, isPasswordValid, newProfile, normalizeHandle, passwordRules } from './domain/account';
export type { AlbumVisibility, HandleProblem, PasswordRule, UserProfile } from './domain/account';
export type { TradeProblem, TradeSide } from './domain/trade';

// Puertos: lo que el núcleo necesita del mundo y cada plataforma implementa con un adaptador.
export { AuthError } from './application/ports/auth-service';
export type { AuthErrorCode, AuthService, AuthUser } from './application/ports/auth-service';
export { HandleTakenError } from './application/ports/user-profile-repository';
export type { UserProfileRepository } from './application/ports/user-profile-repository';
export type { AchievementRepository, EarnedAchievement } from './application/ports/achievement-repository';
export type { PhotoStorage } from './application/ports/photo-storage';
export type { SightingRepository } from './application/ports/sighting-repository';
export type { SpeciesCatalog } from './application/ports/species-catalog';
export type { SpeciesIdentifier, SpeciesSuggestion } from './application/ports/species-identifier';
export type { StickerRepository } from './application/ports/sticker-repository';

// Casos de uso.
export { makeGetAlbumSummary } from './application/use-cases/get-album-summary';
export type { GetAlbumSummary } from './application/use-cases/get-album-summary';
export { makeGetAlbum } from './application/use-cases/get-album';
export type { GetAlbum } from './application/use-cases/get-album';
export { evaluateValidatedPhoto, sightingResultOf } from './application/use-cases/evaluate-validated-photo';
export { makeCheckPhoto, makeRegisterSighting, makeSuggestSpecies } from './application/use-cases/register-sighting';
export type { RegisterSightingInput, Suggestion } from './application/use-cases/register-sighting';
export { makeListSpeciesPhotos } from './application/use-cases/list-species-photos';
export type { SpeciesPhoto } from './application/use-cases/list-species-photos';
export type { ValidatedPhotoResult } from './application/use-cases/evaluate-validated-photo';
export { SignUpValidationError, makeSignUp, signUpProblems } from './application/use-cases/sign-up';
export { makeCheckResetCode, makeRequestPasswordReset, makeResetPassword, makeSignIn, makeSignOut } from './application/use-cases/account-access';
export type { SignUpInput, SignUpProblems } from './application/use-cases/sign-up';
