import { useCallback, useEffect, useState } from 'react';

import { DEFAULT_REGION_ID, type AlbumView } from '@plumario/core';

import { useDependencies } from '@/infrastructure/dependencies';

import { useSession } from './use-session';

type State =
  | { status: 'loading' }
  | { status: 'ready'; album: AlbumView }
  | { status: 'error'; error: Error };

// Álbum, cada hábitat y la galería leen el mismo álbum: se pide una vez por usuario y se comparte
// hasta que algo lo cambie (registrar un ave, un intercambio), que llama a refresh().
const cache = new Map<string, Promise<AlbumView>>();

/** El álbum del usuario en su región, vía el caso de uso getAlbum. */
export function useAlbum(): State & { refresh: () => void } {
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const [state, setState] = useState<State>({ status: 'loading' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    let request = cache.get(userId);
    if (!request) {
      request = useCases.getAlbum({ userId, regionId: DEFAULT_REGION_ID });
      cache.set(userId, request);
      // Si falla, el próximo intento vuelve a pedirlo.
      request.catch(() => cache.delete(userId));
    }
    request
      .then((album) => current && setState({ status: 'ready', album }))
      .catch((error: unknown) => current && setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) }));
    return () => {
      current = false;
    };
  }, [useCases, userId, version]);

  const refresh = useCallback(() => {
    if (userId) cache.delete(userId);
    setVersion((v) => v + 1);
  }, [userId]);

  return { ...state, refresh };
}
