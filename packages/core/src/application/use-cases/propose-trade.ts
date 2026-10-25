import type { AlbumView } from '../../domain/album-view';
import type { UserId } from '../../domain/sighting';
import type { SpeciesId } from '../../domain/species';
import { proposalProblem, type TradeProblem } from '../../domain/trade';
import type { TradeRepository } from '../ports/trade-repository';
import type { UserProfileRepository } from '../ports/user-profile-repository';

export class TradeProposalError extends Error {
  constructor(readonly problem: TradeProblem | 'no-profile') {
    super(`No se puede proponer el intercambio: ${problem}`);
    this.name = 'TradeProposalError';
  }
}

/**
 * Caso de uso: proponer un intercambio (IntercambioProponer). Se revisa lo que depende de quien
 * propone; lo del otro lo revisa el servidor al aceptar, porque sus stickers no se leen.
 */
export function makeProposeTrade(deps: { trades: TradeRepository; profiles: UserProfileRepository; now: () => Date }) {
  return async (userId: UserId, album: AlbumView, offeredId: SpeciesId, requestedId: SpeciesId): Promise<string> => {
    const offered = album.entries.find((e) => e.species.id === offeredId);
    const requested = album.entries.find((e) => e.species.id === requestedId);
    if (!offered) throw new TradeProposalError('offered-not-chromed');
    if (!requested) throw new TradeProposalError('proposer-missing-species');
    const problem = proposalProblem(album, offered, requested);
    if (problem) throw new TradeProposalError(problem);
    const profile = await deps.profiles.get(userId);
    if (!profile) throw new TradeProposalError('no-profile');
    return deps.trades.create({ fromUid: userId, fromHandle: profile.handle, offeredSpeciesId: offeredId, requestedSpeciesId: requestedId, createdAt: deps.now() });
  };
}
