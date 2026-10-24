import { useEffect, useState } from 'react';

import type { AlbumSummary } from '@plumario/core';

import { useDependencies } from '@/infrastructure/dependencies';

type State =
  | { status: 'loading' }
  | { status: 'ready'; summary: AlbumSummary }
  | { status: 'error'; error: Error };

/** El avance del álbum del usuario en su región, vía el caso de uso getAlbumSummary. */
export function useAlbumSummary(): State {
  const { useCases, session } = useDependencies();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let current = true;
    useCases
      .getAlbumSummary(session)
      .then((summary) => current && setState({ status: 'ready', summary }))
      .catch((error: unknown) => current && setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) }));
    return () => {
      current = false;
    };
  }, [useCases, session]);

  return state;
}
