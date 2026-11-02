import { useEffect, useState } from 'react';

import type { Economy } from '@plumario/core';

import { useDependencies } from '@/infrastructure/dependencies';

import { invalidateEconomy, useEconomyVersion } from './economy-version';
import { useSession } from './use-session';

type State = { status: 'loading' } | { status: 'ready'; economy: Economy } | { status: 'error' };

/** Saldo, sobres sin abrir y repetidas. Mientras carga de nuevo se sigue viendo lo anterior. */
export function useEconomy(): State & { refresh: () => void } {
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const version = useEconomyVersion();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!userId) return;
    let current = true;
    useCases.getEconomy(userId).then(
      (economy) => current && setState({ status: 'ready', economy }),
      () => current && setState({ status: 'error' }),
    );
    return () => {
      current = false;
    };
  }, [useCases, userId, version]);

  return { ...state, refresh: invalidateEconomy };
}
