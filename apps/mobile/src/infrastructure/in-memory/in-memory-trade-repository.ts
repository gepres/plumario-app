import type { TradeProposal, TradeRepository, TradeResult, UserId } from '@plumario/core';

import type { InMemoryStickerRepository } from './in-memory-sticker-repository';

/** Una propuesta de muestra de otra persona, para ver IntercambioRecibido en la web (/trade/muestra). */
export const SAMPLE_TRADE: TradeProposal = {
  id: 'muestra',
  fromUid: 'local-2',
  fromHandle: 'beto.ica',
  offeredSpeciesId: 'phoenicopterus-chilensis',
  requestedSpeciesId: 'calidris-alba',
  status: 'open',
  createdAt: new Date(2026, 9, 24),
};

/**
 * Adaptador en memoria del puerto TradeRepository, para la vista web. Hay una sola cuenta, así que
 * aceptar solo cambia los stickers de quien acepta (en Firebase la Cloud Function cambia los dos).
 */
export class InMemoryTradeRepository implements TradeRepository {
  private readonly trades = new Map<string, TradeProposal>([[SAMPLE_TRADE.id, SAMPLE_TRADE]]);
  private nextId = 1;

  constructor(private readonly stickers: InMemoryStickerRepository) {}

  async create(proposal: Omit<TradeProposal, 'id' | 'status' | 'createdAt'> & { createdAt: Date }): Promise<string> {
    const id = `trade-${this.nextId++}`;
    this.trades.set(id, { ...proposal, id, status: 'open' });
    return id;
  }

  async get(tradeId: string): Promise<TradeProposal | null> {
    return this.trades.get(tradeId) ?? null;
  }

  async listByUser(userId: UserId): Promise<readonly TradeProposal[]> {
    return [...this.trades.values()].filter((t) => t.fromUid === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async cancel(tradeId: string): Promise<void> {
    const trade = this.trades.get(tradeId);
    if (trade?.status === 'open') this.trades.set(tradeId, { ...trade, status: 'cancelled' });
  }

  async accept(tradeId: string, userId: UserId): Promise<TradeResult> {
    const trade = this.trades.get(tradeId);
    if (!trade || trade.status !== 'open') return { outcome: 'rejected', reason: 'closed' };
    if (trade.fromUid === userId) return { outcome: 'rejected', reason: 'own-trade' };
    const mine = new Map((await this.stickers.listByUser(userId)).map((s) => [s.speciesId, s]));
    const requested = mine.get(trade.requestedSpeciesId);
    const offered = mine.get(trade.offeredSpeciesId);
    if (!requested?.chrome) return { outcome: 'rejected', reason: 'requested-not-chromed' };
    if (!offered) return { outcome: 'rejected', reason: 'receiver-missing-species' };
    const now = new Date();
    this.stickers.save(userId, { ...requested, chrome: null });
    this.stickers.save(userId, { ...offered, chrome: { source: 'trade', at: now } });
    this.trades.set(tradeId, { ...trade, status: 'accepted' });
    return { outcome: 'accepted' };
  }
}
