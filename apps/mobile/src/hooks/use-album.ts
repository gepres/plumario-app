import { useEffect, useState } from 'react';

import { DEFAULT_REGION_ID, type AlbumView } from '@plumario/core';

import { useDependencies } from '@/infrastructure/dependencies';

import { invalidateAlbum, useAlbumVersion } from './album-version';
import { useSession } from './use-session';

type State =
  | { status: 'loading' }
  | { status: 'ready'; album: AlbumView }
  | { status: 'error'; error: Error };

// Álbum, cada hábitat y la galería leen el mismo álbum: se pide una vez por usuario y versión, y se
// comparte hasta que algo lo cambie (invalidateAlbum).
const cache = new Map<string, Promise<AlbumView>>();

/** El álbum del usuario en su región, vía el caso de uso getAlbum. */
export function useAlbum(): State & { refresh: () => void } {
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const version = useAlbumVersion();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!userId) return;
    let current = true;
    const key = `${userId}|${version}`;
    let request = cache.get(key);
    if (!request) {
      cache.clear();
      request = useCases.getAlbum({ userId, regionId: DEFAULT_REGION_ID });
      cache.set(key, request);
      // Si falla, el próximo intento vuelve a pedirlo.
      request.catch(() => cache.delete(key));
    }
    request
      .then((album) => current && setState({ status: 'ready', album }))
      .catch((error: unknown) => current && setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) }));
    return () => {
      current = false;
    };
  }, [useCases, userId, version]);

  return { ...state, refresh: invalidateAlbum };
}
