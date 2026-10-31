import * as Linking from 'expo-linking';

import type { FinishSource, TradeProblem, TradeResult } from '@plumario/core';

// Textos del intercambio de cromos (IntercambioProponer, IntercambioRecibido).

/** «Holográfico · al completar»: cómo se consiguió cada cromo que se ofrece. */
export const FINISH_SOURCE_NOTES: Record<FinishSource, string> = {
  luck: 'por suerte',
  milestone: 'por hito',
  pack: 'en un sobre',
  purchase: 'con plumas',
  trade: 'por intercambio',
};

type Names = { offered: string; requested: string; handle: string };

/** Por qué no se puede aceptar (o por qué el servidor no lo hizo). */
export function tradeProblemMessage(reason: TradeProblem | Extract<TradeResult, { outcome: 'rejected' }>['reason'], { offered, requested, handle }: Names): string {
  switch (reason) {
    case 'receiver-missing-species': return `Solo se recibe el cromo de una especie ya registrada: primero registra ${offered}.`;
    case 'requested-not-chromed': return `Ya no tienes el cromo de ${requested}.`;
    case 'already-has-chrome': return `Ya tienes el cromo de ${offered}.`;
    case 'offered-not-chromed':
    case 'proposer-missing-species': return `@${handle} ya no puede hacer este intercambio.`;
    case 'unfair-category':
    case 'same-species': return 'Esta propuesta no es pareja: el cromo que se da tiene que ser de igual o mayor categoría.';
    case 'closed': return 'Esta propuesta ya no está disponible.';
    case 'own-trade': return 'Es tu propia propuesta.';
    case 'paused': return 'El intercambio está en pausa por ahora.';
  }
}

/** El enlace de una propuesta (plumario://trade/{id}): abre IntercambioRecibido en la app. */
export const tradeLink = (tradeId: string) => Linking.createURL(`trade/${tradeId}`);
