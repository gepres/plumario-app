import { useEffect, useState } from 'react';

import type { QueuedSighting } from '@plumario/core';

import { useDependencies } from '@/infrastructure/dependencies';

import { useQueueVersion } from './queue-version';
import { useSession } from './use-session';

/** Los registros que esperan señal en el teléfono; se vuelven a leer cuando cambia la cola. */
export function useSightingQueue(): readonly QueuedSighting[] {
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const version = useQueueVersion();
  const [queued, setQueued] = useState<readonly QueuedSighting[]>([]);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    useCases
      .listQueuedSightings(userId)
      .then((found) => current && setQueued(found))
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [useCases, userId, version]);

  return queued;
}
