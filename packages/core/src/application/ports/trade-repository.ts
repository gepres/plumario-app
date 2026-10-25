import type { UserId } from '../../domain/sighting';
import type { TradeProposal, TradeResult } from '../../domain/trade';

/** Puerto de salida: las propuestas de intercambio (trades/{id}). */
export interface TradeRepository {
  /** Guarda una propuesta abierta y devuelve su id, que va en el enlace y en el QR. */
  create(proposal: Omit<TradeProposal, 'id' | 'status' | 'createdAt'> & { createdAt: Date }): Promise<string>;
  get(tradeId: string): Promise<TradeProposal | null>;
  /** Las propuestas que hizo el usuario (Perfil › Intercambios), de la más nueva a la más vieja. */
  listByUser(userId: UserId): Promise<readonly TradeProposal[]>;
  /** Solo quien la propuso, mientras siga abierta. */
  cancel(tradeId: string): Promise<void>;
  /** Pide aceptarla: el servidor hace el intercambio en una transacción y responde. */
  accept(tradeId: string, userId: UserId): Promise<TradeResult>;
}
