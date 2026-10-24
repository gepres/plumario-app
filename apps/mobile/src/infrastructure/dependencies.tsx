import { createContext, use, useState, type ReactNode } from 'react';

import { makeGetAlbumSummary, type GetAlbumSummary, type RegionId, type SpeciesCatalog, type UserId } from '@plumario/core';

import { dataSource, emulatorHost, isFirebaseConfigured, type DataSource } from './firebase/firebase-config';
import { InMemorySightingRepository } from './in-memory/in-memory-sighting-repository';
import { sampleSpeciesCatalog } from './in-memory/sample-species-catalog';

// Raíz de composición: el único lugar de la app que elige adaptadores para los puertos del núcleo.
// Pantallas y hooks piden los casos de uso con useDependencies(); nunca importan un adaptador.
// El catálogo sale de Firestore (emulador o proyecto real) o de la muestra en memoria, según
// EXPO_PUBLIC_DATA_SOURCE; los registros siguen en memoria hasta el modelo de datos.

export type Dependencies = {
  useCases: {
    getAlbumSummary: GetAlbumSummary;
  };
  /** Provisional: el usuario y la región saldrán de Firebase Auth y del perfil. */
  session: { userId: UserId; regionId: RegionId };
  environment: { firebaseConfigured: boolean; dataSource: DataSource };
};

function createSpeciesCatalog(): SpeciesCatalog {
  if (dataSource === 'memory') return sampleSpeciesCatalog;
  // Se carga solo cuando hace falta: en web y sin Firebase no hay módulos nativos que importar.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- carga diferida a propósito
  const { createFirestoreSpeciesCatalog } = require('./firebase/firestore-species-catalog') as typeof import('./firebase/firestore-species-catalog');
  return createFirestoreSpeciesCatalog({ emulatorHost: dataSource === 'emulator' ? emulatorHost : undefined });
}

export function createDependencies(): Dependencies {
  const catalog = createSpeciesCatalog();
  const sightings = new InMemorySightingRepository();
  return {
    useCases: {
      getAlbumSummary: makeGetAlbumSummary({ catalog, sightings }),
    },
    session: { userId: 'demo', regionId: 'ica' },
    environment: { firebaseConfigured: isFirebaseConfigured, dataSource },
  };
}

const DependenciesContext = createContext<Dependencies | null>(null);

/**
 * `value` permite inyectar otras dependencias (pruebas, vistas previas) y manda mientras esté: si
 * cambia, se usa la nueva. Las propias se crean una sola vez; con adaptadores en memoria es barato.
 */
export function DependenciesProvider({ value, children }: { value?: Dependencies; children: ReactNode }) {
  const [own] = useState(createDependencies);
  return <DependenciesContext value={value ?? own}>{children}</DependenciesContext>;
}

export function useDependencies(): Dependencies {
  const dependencies = use(DependenciesContext);
  if (!dependencies) throw new Error('useDependencies necesita un DependenciesProvider más arriba');
  return dependencies;
}
