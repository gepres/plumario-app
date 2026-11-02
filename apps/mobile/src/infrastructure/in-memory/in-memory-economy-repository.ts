import {
  EMPTY_WALLET,
  EconomyError,
  NO_PIECES,
  applyPackPiece,
  applyPurchase,
  packDesign,
  packFinish,
  packSpecies,
  purchaseProblem,
  recyclePiece,
  type CardCategory,
  type Economy,
  type EconomyRepository,
  type ObservationReward,
  type Pack,
  type PackOpening,
  type PieceCounts,
  type PieceFinish,
  type SpeciesId,
  type UserId,
  type Wallet,
} from '@plumario/core';

import type { InMemoryStickerRepository } from './in-memory-sticker-repository';

/**
 * Adaptador en memoria del puerto EconomyRepository, para la vista web. Hace lo que en Firebase hacen
 * las Cloud Functions de functions/src/economy.ts, con las mismas reglas del núcleo.
 */
export class InMemoryEconomyRepository implements EconomyRepository {
  private readonly wallets = new Map<UserId, Wallet>();
  private readonly packs = new Map<UserId, Pack[]>();
  private readonly pieces = new Map<UserId, Map<SpeciesId, PieceCounts>>();

  constructor(private readonly stickers: InMemoryStickerRepository, sample?: { userId: UserId; wallet: Wallet; packs: readonly Pack[]; pieces: Readonly<Record<SpeciesId, PieceCounts>> }) {
    if (!sample) return;
    this.wallets.set(sample.userId, sample.wallet);
    this.packs.set(sample.userId, [...sample.packs]);
    this.pieces.set(sample.userId, new Map(Object.entries(sample.pieces)));
  }

  private wallet = (userId: UserId) => this.wallets.get(userId) ?? EMPTY_WALLET;
  private piecesOf(userId: UserId) {
    const owned = this.pieces.get(userId) ?? new Map<SpeciesId, PieceCounts>();
    this.pieces.set(userId, owned);
    return owned;
  }

  async get(userId: UserId): Promise<Economy> {
    return {
      wallet: this.wallet(userId),
      packs: (this.packs.get(userId) ?? []).filter((p) => !p.opening),
      pieces: [...this.piecesOf(userId)].map(([speciesId, counts]) => ({ speciesId, counts })),
    };
  }

  /** Lo que en Firebase escribe onSightingCreated al validar una foto. */
  credit(userId: UserId, reward: ObservationReward, packId: string, at: Date): void {
    if (reward.feathers > 0) this.wallets.set(userId, reward.wallet);
    if (!reward.pack) return;
    const pack: Pack = { id: packId, speciesIds: reward.pack, design: packDesign(Math.random()), createdAt: at, opening: null };
    this.packs.set(userId, [...(this.packs.get(userId) ?? []), pack]);
  }

  /** El saldo sobre el que se calcula el premio de una foto. */
  walletOf(userId: UserId): Wallet {
    return this.wallet(userId);
  }

  async openPack(userId: UserId, packId: string): Promise<PackOpening> {
    const pack = (this.packs.get(userId) ?? []).find((p) => p.id === packId);
    if (!pack) throw new EconomyError('no-pack');
    if (pack.opening) return pack.opening;
    const speciesId = packSpecies(pack.speciesIds, Math.random());
    const finish = packFinish(Math.random());
    const sticker = (await this.stickers.listByUser(userId)).find((s) => s.speciesId === speciesId);
    if (!sticker) throw new EconomyError('no-pack');
    const at = new Date();
    const owned = this.piecesOf(userId);
    const result = applyPackPiece({ sticker, counts: owned.get(speciesId) ?? NO_PIECES, finish, at });
    this.stickers.save(userId, result.sticker);
    owned.set(speciesId, result.counts);
    const opening = { speciesId, finish, upgraded: result.upgraded, at };
    this.packs.set(userId, (this.packs.get(userId) ?? []).map((p) => (p.id === packId ? { ...p, opening } : p)));
    return opening;
  }

  async recyclePiece(userId: UserId, speciesId: SpeciesId, finish: PieceFinish): Promise<number> {
    const owned = this.piecesOf(userId);
    const result = recyclePiece(this.wallet(userId), owned.get(speciesId) ?? NO_PIECES, finish);
    if (!result) throw new EconomyError('no-piece');
    owned.set(speciesId, result.counts);
    this.wallets.set(userId, result.wallet);
    return result.feathers;
  }

  async buyFinish(userId: UserId, speciesId: SpeciesId, finish: CardCategory): Promise<void> {
    const sticker = (await this.stickers.listByUser(userId)).find((s) => s.speciesId === speciesId) ?? null;
    const wallet = this.wallet(userId);
    const at = new Date();
    const problem = purchaseProblem({ sticker, wallet, finish, at });
    if (problem) throw new EconomyError(problem);
    const result = applyPurchase({ sticker: sticker!, wallet, finish, at });
    this.stickers.save(userId, result.sticker);
    this.wallets.set(userId, result.wallet);
  }
}
