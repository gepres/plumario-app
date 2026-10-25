import { useEffect, useState } from 'react';

import type { SavedPoster } from '@plumario/core';

import { useDependencies } from '@/infrastructure/dependencies';

import { usePostersVersion } from './posters-version';
import { useSession } from './use-session';

/** Los pósteres guardados del usuario; se vuelven a pedir al guardar uno. */
export function usePosters(): readonly SavedPoster[] | null {
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const version = usePostersVersion();
  const [posters, setPosters] = useState<readonly SavedPoster[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    useCases
      .listPosters(userId)
      .then((found) => current && setPosters(found))
      .catch(() => current && setPosters([]));
    return () => {
      current = false;
    };
  }, [useCases, userId, version]);

  return posters;
}
