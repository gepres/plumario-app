import type { AlbumEntry, AlbumView } from './album-view';
import { isFairTrade, type CardCategory } from './card';
import type { UserId } from './sighting';
import type { SpeciesId } from './species';
import { grantFinish, type Sticker } from './sticker';

// Intercambio de cromos. Está en pausa desde la fase 1: sus reglas nuevas (mismo acabado, sin que tu
// álbum pierda nada) llegan en la fase 2B, sobre esta misma infraestructura de propuestas y enlaces.

/** Mientras sea true, la app muestra IntercambioPausa y el servidor rechaza las aceptaciones. */
export const TRADES_PAUSED = true;

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

type TradeCard = { speciesId: SpeciesId; category: CardCategory };

/** Lo que depende solo de las especies: una distinta de la otra y un cromo de igual o mayor categoría. */
function cardsProblem(offered: TradeCard, requested: TradeCard): TradeProblem | null {
  if (offered.speciesId === requested.speciesId) return 'same-species';
  if (!isFairTrade(offered.category, requested.category)) return 'unfair-category';
  return null;
}

/** Quien propone: tiene el cromo que ofrece, y el sticker normal (sin cromo) de la especie que pide. */
export function proposerProblem(proposer: TradeSide, offered: TradeCard, requested: TradeCard): TradeProblem | null {
  const problem = cardsProblem(offered, requested);
  if (problem) return problem;
  if (!proposer.stickers.get(offered.speciesId)?.best) return 'offered-not-chromed';
  if (!proposer.stickers.has(requested.speciesId)) return 'proposer-missing-species';
  if (proposer.stickers.get(requested.speciesId)?.best) return 'already-has-chrome';
  return null;
}

/** Quien recibe: tiene el cromo que le piden, y el sticker normal (sin cromo) de la especie que le ofrecen. */
export function receiverProblem(receiver: TradeSide, offered: TradeCard, requested: TradeCard): TradeProblem | null {
  const problem = cardsProblem(offered, requested);
  if (problem) return problem;
  if (!receiver.stickers.get(requested.speciesId)?.best) return 'requested-not-chromed';
  if (!receiver.stickers.has(offered.speciesId)) return 'receiver-missing-species';
  if (receiver.stickers.get(offered.speciesId)?.best) return 'already-has-chrome';
  return null;
}

/**
 * Por qué no se puede hacer un intercambio, o null si se puede. `proposer` ofrece `offered` y pide
 * `requested`; `receiver` tiene el cromo de `requested` y recibiría el de `offered`.
 */
export function tradeProblem(proposer: TradeSide, receiver: TradeSide, offered: TradeCard, requested: TradeCard): TradeProblem | null {
  return proposerProblem(proposer, offered, requested) ?? receiverProblem(receiver, offered, requested);
}

/** Los stickers que cambian al aceptar: cada uno pierde su cromo y gana el del otro. */
export function applyTrade(
  proposer: TradeSide,
  receiver: TradeSide,
  offered: SpeciesId,
  requested: SpeciesId,
  at: Date,
): { proposer: Sticker[]; receiver: Sticker[] } {
  const take = (side: TradeSide, id: SpeciesId): Sticker => ({ ...side.stickers.get(id)!, best: null });
  const give = (side: TradeSide, id: SpeciesId, from: TradeSide): Sticker => grantFinish(side.stickers.get(id)!, from.stickers.get(id)!.best!, 'trade', at).sticker;
  return {
    proposer: [take(proposer, offered), give(proposer, requested, receiver)],
    receiver: [take(receiver, requested), give(receiver, offered, proposer)],
  };
}

export type TradeStatus = 'open' | 'accepted' | 'cancelled';

/** Una propuesta (trades/{id}): se comparte por enlace o QR y la acepta quien la abra y cumpla. */
export type TradeProposal = {
  id: string;
  fromUid: UserId;
  /** El @usuario de quien propone, para «@ana te propone cambiar un cromo». */
  fromHandle: string;
  offeredSpeciesId: SpeciesId;
  requestedSpeciesId: SpeciesId;
  status: TradeStatus;
  createdAt: Date;
};

/** Lo que responde el servidor al aceptar. */
export type TradeResult = { outcome: 'accepted' } | { outcome: 'rejected'; reason: TradeProblem | 'closed' | 'own-trade' | 'paused' };

const sideOf = (album: AlbumView): TradeSide => ({
  stickers: new Map(album.entries.filter((e) => e.sticker).map((e) => [e.species.id, e.sticker!])),
});
const cardOf = (entry: AlbumEntry): TradeCard => ({ speciesId: entry.species.id, category: entry.finish ?? 'holographic' });

/** IntercambioProponer, «Ofreces a cambio»: mis cromos que alcanzan para pedir el de `requested`. */
export function offerOptions(album: AlbumView, requested: AlbumEntry): AlbumEntry[] {
  const me = sideOf(album);
  return album.entries.filter((e) => e.sticker?.best && proposerProblem(me, cardOf(e), cardOf(requested)) === null);
}

/** Al ofrecer un cromo propio: las especies que puedo pedir a cambio (registradas, sin cromo, de igual o menor categoría). */
export function requestOptions(album: AlbumView, offered: AlbumEntry): AlbumEntry[] {
  const me = sideOf(album);
  return album.entries.filter((e) => e.sticker && !e.sticker.best && proposerProblem(me, cardOf(offered), cardOf(e)) === null);
}

/** Antes de proponer: por qué no se puede, o null. */
export function proposalProblem(album: AlbumView, offered: AlbumEntry, requested: AlbumEntry): TradeProblem | null {
  return proposerProblem(sideOf(album), cardOf(offered), cardOf(requested));
}

export type ReceivedTrade =
  | { status: 'own' | 'accepted' | 'cancelled' | 'unknown-species'; offered: AlbumEntry | null; requested: AlbumEntry | null }
  | { status: 'ready'; offered: AlbumEntry; requested: AlbumEntry }
  | { status: 'blocked'; problem: TradeProblem; offered: AlbumEntry; requested: AlbumEntry };

/** IntercambioRecibido: qué ve quien abre el enlace, con su álbum (los stickers del otro no se leen). */
export function receivedTrade(trade: TradeProposal, album: AlbumView, userId: UserId): ReceivedTrade {
  const offered = album.entries.find((e) => e.species.id === trade.offeredSpeciesId) ?? null;
  const requested = album.entries.find((e) => e.species.id === trade.requestedSpeciesId) ?? null;
  if (trade.fromUid === userId) return { status: 'own', offered, requested };
  if (trade.status !== 'open') return { status: trade.status, offered, requested };
  if (!offered || !requested) return { status: 'unknown-species', offered, requested };
  const problem = receiverProblem(sideOf(album), cardOf(offered), cardOf(requested));
  return problem ? { status: 'blocked', problem, offered, requested } : { status: 'ready', offered, requested };
}
