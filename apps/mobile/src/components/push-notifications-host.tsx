import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import type { PushNotice } from '@plumario/core';
import { NoticeBanner } from '@plumario/ui';

import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

/** Cuánto queda a la vista un aviso que llegó con la app abierta. */
const SHOWN_MS = 5000;

const open = (notice: PushNotice) => {
  if (notice.path) router.push(notice.path as Href);
};

/**
 * Los avisos push, con sesión: registra este teléfono en la cuenta (si ya dio permiso), abre la
 * pantalla de un aviso tocado y muestra arriba los que llegan con la app abierta. Las medallas no:
 * ya se celebran en pantalla (CelebrationHost).
 */
export function PushNotificationsHost() {
  const { useCases, notifications, errors } = useDependencies();
  const userId = useSession()?.uid;
  const [notice, setNotice] = useState<PushNotice | null>(null);

  useEffect(() => {
    if (!userId) return;
    errors.setUser(userId);
    useCases.registerDevice(userId).catch((error: unknown) => errors.record(error, 'Registrar el teléfono para los avisos'));
    return () => errors.setUser(null);
  }, [useCases, errors, userId]);

  useEffect(() => {
    // Si un aviso abrió la app, se va a su pantalla después de que Stack.Protected lleve a Inicio.
    let timer: ReturnType<typeof setTimeout> | undefined;
    void notifications.initialNotice().then((first) => {
      if (first) timer = setTimeout(() => open(first), 300);
    });
    const stopOpened = notifications.onOpened(open);
    const stopForeground = notifications.onForeground((arrived) => {
      if (arrived.topic !== 'achievements') setNotice(arrived);
    });
    return () => {
      clearTimeout(timer);
      stopOpened();
      stopForeground();
    };
  }, [notifications]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), SHOWN_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;
  return (
    <NoticeBanner
      title={notice.title}
      body={notice.body}
      onPress={
        notice.path
          ? () => {
              setNotice(null);
              open(notice);
            }
          : undefined
      }
      onClose={() => setNotice(null)}
    />
  );
}
