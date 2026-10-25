import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import {
  type AchievementRepository,
  makeCheckPhoto,
  makeCheckResetCode,
  makeGetAlbum,
  makeGetAlbumSummary,
  makeListCoverPhotos,
  makeListSpeciesPhotos,
  makeProposeTrade,
  makeRegisterSighting,
  makeSavePoster,
  makeRequestPasswordReset,
  makeResetPassword,
  makeSignIn,
  makeSignOut,
  makeSignUp,
  makeSuggestSpecies,
  type AuthService,
  type GetAlbum,
  type GetAlbumSummary,
  type PhotoStorage,
  type PosterRepository,
  type SightingRepository,
  type SpeciesCatalog,
  type SpeciesIdentifier,
  type StickerRepository,
  type TradeRepository,
  type UserProfileRepository,
} from '@plumario/core';

import { dataSource, emulatorHost, isFirebaseConfigured, type DataSource } from './firebase/firebase-config';
import { InMemoryAchievementRepository } from './in-memory/in-memory-achievement-repository';
import { InMemoryAuthService } from './in-memory/in-memory-auth-service';
import { InMemoryPosterRepository } from './in-memory/in-memory-poster-repository';
import { InMemoryTradeRepository } from './in-memory/in-memory-trade-repository';
import { InMemorySightingRepository, inMemoryPhotoStorage } from './in-memory/in-memory-sightings';
import { InMemoryStickerRepository, SAMPLE_STICKERS } from './in-memory/in-memory-sticker-repository';
import { InMemoryUserProfileRepository } from './in-memory/in-memory-user-profile-repository';
import { sampleSpeciesCatalog } from './in-memory/sample-species-catalog';
import { testSpeciesIdentifier } from './test-species-identifier';

// Raíz de composición: el único lugar de la app que elige adaptadores para los puertos del núcleo.
// Pantallas y hooks piden los casos de uso con useDependencies(); nunca importan un adaptador.
// Con EXPO_PUBLIC_DATA_SOURCE = emulator o firebase, todo sale de Firebase (emuladores locales o el
// proyecto real); si no, de los adaptadores en memoria con la muestra del diseño.

type Adapters = {
  auth: AuthService;
  achievements: AchievementRepository;
  catalog: SpeciesCatalog;
  stickers: StickerRepository;
  profiles: UserProfileRepository;
  photos: PhotoStorage;
  posters: PosterRepository;
  sightings: SightingRepository;
  trades: TradeRepository;
  identifier: SpeciesIdentifier;
};

export type Dependencies = {
  useCases: {
    getAlbum: GetAlbum;
    getAlbumSummary: GetAlbumSummary;
    signIn: ReturnType<typeof makeSignIn>;
    signUp: ReturnType<typeof makeSignUp>;
    signOut: ReturnType<typeof makeSignOut>;
    requestPasswordReset: ReturnType<typeof makeRequestPasswordReset>;
    checkResetCode: ReturnType<typeof makeCheckResetCode>;
    resetPassword: ReturnType<typeof makeResetPassword>;
    suggestSpecies: ReturnType<typeof makeSuggestSpecies>;
    checkPhoto: ReturnType<typeof makeCheckPhoto>;
    registerSighting: ReturnType<typeof makeRegisterSighting>;
    listSpeciesPhotos: ReturnType<typeof makeListSpeciesPhotos>;
    listCoverPhotos: ReturnType<typeof makeListCoverPhotos>;
    listPosters: PosterRepository['listByUser'];
    savePoster: ReturnType<typeof makeSavePoster>;
    getProfile: UserProfileRepository['get'];
    proposeTrade: ReturnType<typeof makeProposeTrade>;
    getTrade: TradeRepository['get'];
    cancelTrade: TradeRepository['cancel'];
    acceptTrade: TradeRepository['accept'];
  };
  /** Seguir un registro hasta que el servidor lo valide (Registrar, resultado). */
  watchSighting: SightingRepository['watch'];
  /** Los logros: listarlos (Recompensas), escuchar los no celebrados y marcarlos vistos. */
  achievements: AchievementRepository;
  /** Quién tiene la sesión abierta, para useSession(). */
  session: Pick<AuthService, 'currentUser' | 'onChange'>;
  environment: { firebaseConfigured: boolean; dataSource: DataSource };
};

function createAdapters(): Adapters | Promise<Adapters> {
  if (dataSource === 'memory') {
    const stickers = new InMemoryStickerRepository({ [InMemoryAuthService.SAMPLE_UID]: SAMPLE_STICKERS });
    const achievements = new InMemoryAchievementRepository();
    return {
      auth: new InMemoryAuthService(),
      achievements,
      catalog: sampleSpeciesCatalog,
      stickers,
      profiles: new InMemoryUserProfileRepository(),
      photos: inMemoryPhotoStorage,
      posters: new InMemoryPosterRepository(),
      trades: new InMemoryTradeRepository(stickers),
      sightings: new InMemorySightingRepository({ catalog: sampleSpeciesCatalog, stickers, achievements, identifier: testSpeciesIdentifier }),
      identifier: testSpeciesIdentifier,
    };
  }
  // Se carga solo cuando hace falta: en web y sin Firebase no hay módulos nativos que importar.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- carga diferida a propósito
  const { createFirebaseAdapters } = require('./firebase/firebase-adapters') as typeof import('./firebase/firebase-adapters');
  return createFirebaseAdapters({ emulatorHost: dataSource === 'emulator' ? emulatorHost : undefined });
}

export function createDependencies(adapters: Adapters): Dependencies {
  const { auth, achievements, catalog, stickers, profiles, photos, posters, sightings, trades, identifier } = adapters;
  return {
    useCases: {
      getAlbum: makeGetAlbum({ catalog, stickers }),
      getAlbumSummary: makeGetAlbumSummary({ catalog, stickers }),
      signIn: makeSignIn({ auth }),
      signUp: makeSignUp({ auth, profiles, now: () => new Date() }),
      signOut: makeSignOut({ auth }),
      requestPasswordReset: makeRequestPasswordReset({ auth }),
      checkResetCode: makeCheckResetCode({ auth }),
      resetPassword: makeResetPassword({ auth }),
      suggestSpecies: makeSuggestSpecies({ identifier }),
      checkPhoto: makeCheckPhoto({ identifier }),
      registerSighting: makeRegisterSighting({ photos, sightings, now: () => new Date() }),
      listSpeciesPhotos: makeListSpeciesPhotos({ sightings, photos }),
      listCoverPhotos: makeListCoverPhotos({ sightings, photos }),
      listPosters: (userId) => posters.listByUser(userId),
      savePoster: makeSavePoster({ posters, now: () => new Date() }),
      getProfile: (userId) => profiles.get(userId),
      proposeTrade: makeProposeTrade({ trades, profiles, now: () => new Date() }),
      getTrade: (tradeId) => trades.get(tradeId),
      cancelTrade: (tradeId) => trades.cancel(tradeId),
      acceptTrade: (tradeId, userId) => trades.accept(tradeId, userId),
    },
    watchSighting: (userId, sightingId, listener) => sightings.watch(userId, sightingId, listener),
    achievements,
    session: auth,
    environment: { firebaseConfigured: isFirebaseConfigured, dataSource },
  };
}

const DependenciesContext = createContext<Dependencies | null>(null);

// Las propias se crean una sola vez por carga del módulo, aunque el proveedor se monte dos veces.
let ownDependencies: Promise<Dependencies> | null = null;
const loadOwnDependencies = () => (ownDependencies ??= Promise.resolve(createAdapters()).then(createDependencies));

/**
 * `value` permite inyectar otras dependencias (pruebas, vistas previas) y manda mientras esté: si
 * cambia, se usa la nueva. Mientras se preparan las propias (Firebase se conecta de forma
 * asíncrona) no muestra nada y la pantalla de arranque sigue visible.
 */
export function DependenciesProvider({ value, children }: { value?: Dependencies; children: ReactNode }) {
  const [own, setOwn] = useState<Dependencies | null>(null);
  const [failure, setFailure] = useState<unknown>(null);

  useEffect(() => {
    if (value) return;
    let current = true;
    loadOwnDependencies().then(
      (dependencies) => current && setOwn(dependencies),
      (error: unknown) => current && setFailure(error ?? new Error('No se pudo preparar la app')),
    );
    return () => {
      current = false;
    };
  }, [value]);

  // Sin dependencias la app no puede seguir: el error sube a la pantalla de error de expo-router.
  if (failure) throw failure;
  const dependencies = value ?? own;
  if (!dependencies) return null;
  return <DependenciesContext value={dependencies}>{children}</DependenciesContext>;
}

export function useDependencies(): Dependencies {
  const dependencies = use(DependenciesContext);
  if (!dependencies) throw new Error('useDependencies necesita un DependenciesProvider más arriba');
  return dependencies;
}
