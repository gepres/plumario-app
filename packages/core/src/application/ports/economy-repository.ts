import type { CardCategory } from '../../domain/card';
import type { Economy, PackOpening, PieceFinish, PurchaseProblem } from '../../domain/economy';
import type { UserId } from '../../domain/sighting';
import type { SpeciesId } from '../../domain/species';

export type EconomyErrorCode = PurchaseProblem | 'no-piece' | 'no-pack' | 'unavailable';

/** Lo que el servidor no aceptó, o que no se pudo preguntar. */
export class EconomyError extends Error {
  constructor(readonly code: EconomyErrorCode) {
    super(code);
    this.name = 'EconomyError';
  }
}

/**
 * Puerto de salida: saldo, sobres y repetidas. La app solo lee y pide; lo que cambia el saldo o el álbum
 * lo decide el servidor en una transacción, porque el cliente no es de fiar con lo que vale algo.
 */
export interface EconomyRepository {
  get(userId: UserId): Promise<Economy>;
  /** Abrir dos veces el mismo sobre devuelve lo que ya trajo. */
  openPack(userId: UserId, packId: string): Promise<PackOpening>;
  /** Devuelve las plumas ganadas. */
  recyclePiece(userId: UserId, speciesId: SpeciesId, finish: PieceFinish): Promise<number>;
  /** `finish` es el acabado que la persona vio en pantalla. */
  buyFinish(userId: UserId, speciesId: SpeciesId, finish: CardCategory): Promise<void>;
}
