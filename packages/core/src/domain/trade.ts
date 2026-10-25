import { isFairTrade, type CardCategory } from './card';
import type { SpeciesId } from './species';
import type { Sticker } from './sticker';

// Intercambio de cromos (design/project/IntercambioProponer.dc.html): uno por uno, dando un cromo de
// igual o mayor categoría. Solo se recibe el cromo de una especie ya registrada, y al aceptar cada uno
// recibe el cromo del otro mientras el suyo vuelve a la versión normal. No se comparten fotos ni ubicación.

export type TradeSide = {
  /** Stickers del participante, por especie. */
  stickers: ReadonlyMap<SpeciesId, Sticker>;
};

export type TradeProblem =
  | 'offered-not-chromed'
  | 'requested-not-chromed'
  | 'receiver-missing-species'
  | 'proposer-missing-species'
  | 'already-has-chrome'
  | 'unfair-category'
  | 'same-species';

/**
 * Por qué no se puede hacer un intercambio, o null si se puede. `proposer` ofrece `offered` y pide
 * `requested`; `receiver` tiene el cromo de `requested` y recibiría el de `offered`.
 */
export function tradeProblem(
  proposer: TradeSide,
  receiver: TradeSide,
  offered: { speciesId: SpeciesId; category: CardCategory },
  requested: { speciesId: SpeciesId; category: CardCategory },
): TradeProblem | null {
  if (offered.speciesId === requested.speciesId) return 'same-species';
  if (!proposer.stickers.get(offered.speciesId)?.chrome) return 'offered-not-chromed';
  if (!receiver.stickers.get(requested.speciesId)?.chrome) return 'requested-not-chromed';
  if (!proposer.stickers.has(requested.speciesId)) return 'proposer-missing-species';
  if (!receiver.stickers.has(offered.speciesId)) return 'receiver-missing-species';
  if (proposer.stickers.get(requested.speciesId)?.chrome || receiver.stickers.get(offered.speciesId)?.chrome) return 'already-has-chrome';
  if (!isFairTrade(offered.category, requested.category)) return 'unfair-category';
  return null;
}

/** Los stickers que cambian al aceptar: cada uno pierde su cromo y gana el del otro. */
export function applyTrade(
  proposer: TradeSide,
  receiver: TradeSide,
  offered: SpeciesId,
  requested: SpeciesId,
  at: Date,
): { proposer: Sticker[]; receiver: Sticker[] } {
  const take = (side: TradeSide, id: SpeciesId): Sticker => ({ ...side.stickers.get(id)!, chrome: null });
  const give = (side: TradeSide, id: SpeciesId): Sticker => ({ ...side.stickers.get(id)!, chrome: { source: 'trade', at } });
  return {
    proposer: [take(proposer, offered), give(proposer, requested)],
    receiver: [take(receiver, requested), give(receiver, offered)],
  };
}
