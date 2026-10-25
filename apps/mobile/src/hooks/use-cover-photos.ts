import { useEffect, useState } from 'react';

import { useDependencies } from '@/infrastructure/dependencies';

import { useSession } from './use-session';

/**
 * «Usar mis fotos» (PosterVista): la foto de cada especie, solo mientras el interruptor está encendido.
 * null mientras se buscan.
 */
export function useCoverPhotos(speciesIds: readonly string[], enabled: boolean): Record<string, string> | null {
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const [found, setFound] = useState<{ key: string; photos: Record<string, string> } | null>(null);
  // Las mismas especies dan la misma clave aunque el arreglo cambie de identidad en cada render.
  const key = speciesIds.join(',');

  useEffect(() => {
    if (!enabled || !userId) return;
    let current = true;
    useCases
      .listCoverPhotos(userId, key ? key.split(',') : [])
      .then((photos) => current && setFound({ key, photos }))
      .catch(() => current && setFound({ key, photos: {} }));
    return () => {
      current = false;
    };
  }, [useCases, userId, key, enabled]);

  if (!enabled) return {};
  return found?.key === key ? found.photos : null;
}
