import { useEffect, useState } from 'react';

import type { EarnedAchievement } from '@plumario/core';

import { useDependencies } from '@/infrastructure/dependencies';

import { useAlbumVersion } from './album-version';
import { useSession } from './use-session';

/** Los logros guardados del usuario (con su fecha); se vuelven a pedir cuando cambia el álbum. */
export function useAchievements(): readonly EarnedAchievement[] | null {
  const { achievements } = useDependencies();
  const userId = useSession()?.uid;
  const version = useAlbumVersion();
  const [list, setList] = useState<readonly EarnedAchievement[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    achievements
      .listByUser(userId)
      .then((found) => current && setList(found))
      // Sin los registros, las medallas igual salen del álbum (solo faltan las fechas).
      .catch(() => current && setList([]));
    return () => {
      current = false;
    };
  }, [achievements, userId, version]);

  return list;
}
