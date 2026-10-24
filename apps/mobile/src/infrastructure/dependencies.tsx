import { createContext, use, useState, type ReactNode } from 'react';

import { makeGetAlbumSummary, type GetAlbumSummary, type RegionId, type UserId } from '@plumario/core';

import { isFirebaseConfigured } from './firebase/firebase-config';
import { InMemorySightingRepository } from './in-memory/in-memory-sighting-repository';
import { sampleSpeciesCatalog } from './in-memory/sample-species-catalog';

// Raíz de composición: el único lugar de la app que elige adaptadores para los puertos del núcleo.
// Pantallas y hooks piden los casos de uso con useDependencies(); nunca importan un adaptador.
// Hoy todo es en memoria: los adaptadores de Firestore entran con el modelo de datos, detrás de
// isFirebaseConfigured.

export type Dependencies = {
  useCases: {
    getAlbumSummary: GetAlbumSummary;
  };
  /** Provisional: el usuario y la región saldrán de Firebase Auth y del perfil. */
  session: { userId: UserId; regionId: RegionId };
  environment: { firebaseConfigured: boolean };
};

export function createDependencies(): Dependencies {
  const catalog = sampleSpeciesCatalog;
  const sightings = new InMemorySightingRepository();
  return {
    useCases: {
      getAlbumSummary: makeGetAlbumSummary({ catalog, sightings }),
    },
    session: { userId: 'demo', regionId: 'ica' },
    environment: { firebaseConfigured: isFirebaseConfigured },
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
