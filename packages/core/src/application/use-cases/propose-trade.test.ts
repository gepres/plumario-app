import { describe, expect, it } from 'vitest';

import { buildAlbumView } from '../../domain/album-view';
import { at, species, sticker } from '../../testing';
import type { TradeRepository } from '../ports/trade-repository';
import type { UserProfileRepository } from '../ports/user-profile-repository';
import { TradeProposalError, makeProposeTrade } from './propose-trade';

describe('proponer un intercambio', () => {
  const chrome = { source: 'luck' as const, at: at(2) };
  const album = buildAlbumView([species('playero'), species('gaviota'), species('pinguino', { endemic: true })], [sticker('playero', { chrome }), sticker('gaviota'), sticker('pinguino')]);
  const created: Parameters<TradeRepository['create']>[0][] = [];
  const trades = { create: async (p) => (created.push(p), 't1') } as TradeRepository;
  const profiles = { get: async () => ({ handle: 'ana', displayName: 'Ana' }) } as unknown as UserProfileRepository;
  const propose = makeProposeTrade({ trades, profiles, now: () => at(5) });

  it('guarda la propuesta abierta con el @usuario de quien propone', async () => {
    await expect(propose('u1', album, 'playero', 'gaviota')).resolves.toBe('t1');
    expect(created[0]).toEqual({ fromUid: 'u1', fromHandle: 'ana', offeredSpeciesId: 'playero', requestedSpeciesId: 'gaviota', createdAt: at(5) });
  });

  it('no deja pedir un cromo de mayor categoría que el que se ofrece', async () => {
    await expect(propose('u1', album, 'playero', 'pinguino')).rejects.toEqual(new TradeProposalError('unfair-category'));
  });
});
