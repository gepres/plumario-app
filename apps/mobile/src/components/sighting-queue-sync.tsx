import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { invalidateAlbum } from '@/hooks/album-version';
import { invalidateQueue } from '@/hooks/queue-version';
import { useSession } from '@/hooks/use-session';
import { useSightingQueue } from '@/hooks/use-sighting-queue';
import { useDependencies } from '@/infrastructure/dependencies';

/** Cada cuánto se reintenta mientras haya registros esperando señal. */
const RETRY_MS = 30_000;

/**
 * «Registrar sin señal»: sube los registros guardados en el teléfono al abrir la app, al volver a
 * ella y, mientras queden, cada 30 segundos. No dibuja nada.
 */
export function SightingQueueSync() {
  const { useCases, watchSighting } = useDependencies();
  const userId = useSession()?.uid;
  const pending = useSightingQueue().length;
  const running = useRef(false);
  // Los subidos que todavía valida el servidor: al llegar su resultado se relee el álbum.
  const watching = useRef(new Map<string, () => void>());

  useEffect(() => {
    const subscriptions = watching.current;
    return () => {
      for (const stop of subscriptions.values()) stop();
      subscriptions.clear();
    };
  }, []);

  useEffect(() => {
    if (!userId || pending === 0) return;
    const flush = async () => {
      if (running.current) return;
      running.current = true;
      try {
        const sent = await useCases.sendQueuedSightings(userId);
        if (sent.length) invalidateQueue();
        for (const sightingId of sent) {
          const stop = watchSighting(userId, sightingId, (sighting) => {
            if (!sighting?.result) return;
            invalidateAlbum();
            watching.current.get(sightingId)?.();
            watching.current.delete(sightingId);
          });
          watching.current.set(sightingId, stop);
        }
      } catch {
        // Un error que no es de red (p. ej., permisos): se reintenta en la próxima vuelta.
      } finally {
        running.current = false;
      }
    };
    void flush();
    const timer = setInterval(() => void flush(), RETRY_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void flush();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [useCases, watchSighting, userId, pending]);

  return null;
}
