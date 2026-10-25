import { useEffect, useState } from 'react';

import type { SpeciesPhoto } from '@plumario/core';

import { useDependencies } from '@/infrastructure/dependencies';

import { useAlbumVersion } from './album-version';
import { useQueueVersion } from './queue-version';
import { useSession } from './use-session';

type State = { status: 'loading' } | { status: 'ready'; photos: SpeciesPhoto[] } | { status: 'error' };

/** Las fotos de una especie (GaleriaEspecie); se vuelven a pedir cuando cambia el álbum. */
export function useSpeciesPhotos(speciesId: string): State {
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const version = useAlbumVersion();
  const queueVersion = useQueueVersion();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!userId) return;
    let current = true;
    useCases
      .listSpeciesPhotos(userId, speciesId)
      .then((photos) => current && setState({ status: 'ready', photos }))
      .catch(() => current && setState({ status: 'error' }));
    return () => {
      current = false;
    };
  }, [useCases, userId, speciesId, version, queueVersion]);

  return state;
}
