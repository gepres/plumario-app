import { useEffect, useState } from 'react';

import type { UserProfile } from '@plumario/core';

import { useDependencies } from '@/infrastructure/dependencies';

import { useSession } from './use-session';

/** El perfil del usuario (nombre, @usuario, región, privacidad); null mientras carga o si no tiene. */
export function useProfile(): UserProfile | null {
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    useCases
      .getProfile(userId)
      .then((found) => current && setProfile(found))
      .catch(() => current && setProfile(null));
    return () => {
      current = false;
    };
  }, [useCases, userId]);

  return profile;
}
