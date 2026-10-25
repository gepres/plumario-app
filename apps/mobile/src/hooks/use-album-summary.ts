import { useEffect, useState } from 'react';

import { DEFAULT_REGION_ID, type AlbumSummary } from '@plumario/core';

import { useDependencies } from '@/infrastructure/dependencies';

import { useAlbumVersion } from './album-version';
import { useSession } from './use-session';

type State =
  | { status: 'loading' }
  | { status: 'ready'; summary: AlbumSummary }
  | { status: 'error'; error: Error };

/** El avance del álbum del usuario en su región, vía el caso de uso getAlbumSummary. */
export function useAlbumSummary(): State {
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const version = useAlbumVersion();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!userId) return;
    let current = true;
    useCases
      .getAlbumSummary({ userId, regionId: DEFAULT_REGION_ID })
      .then((summary) => current && setState({ status: 'ready', summary }))
      .catch((error: unknown) => current && setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) }));
    return () => {
      current = false;
    };
  }, [useCases, userId, version]);

  return state;
}
