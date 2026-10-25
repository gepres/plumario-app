import { useEffect, useState } from 'react';

import { sharedName, type UserProfile } from '@plumario/core';

import { useDependencies } from '@/infrastructure/dependencies';

import { useProfileVersion } from './profile-version';
import { useSession } from './use-session';

/** El perfil del usuario (nombre, @usuario, región, privacidad); null mientras carga o si no tiene. Se vuelve a pedir al editarlo. */
export function useProfile(): UserProfile | null {
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const version = useProfileVersion();
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
  }, [useCases, userId, version]);

  return profile;
}

/** Cómo firma en pósteres y tarjetas: su nombre o, si lo apagó en Privacidad, su @usuario. */
export function useCollectorName(): string {
  const profile = useProfile();
  return profile ? sharedName(profile) : '';
}
