import { describe, expect, it } from 'vitest';

import { at, species, sticker } from '../testing';
import { buildAlbumView, type AlbumView } from './album-view';
import type { Sticker } from './sticker';
import { applyTrade, offerOptions, receivedTrade, requestOptions, tradeProblem, type TradeProposal, type TradeSide } from './trade';

const chrome = { best: 'holographic' as const };
const side = (...stickers: Sticker[]): TradeSide => ({ stickers: new Map(stickers.map((s) => [s.speciesId, s])) });

// Ana ofrece su cromo de Playero (holográfico) y pide el de Gaviota (holográfico) a Beto.
const ana = side(sticker('playero', chrome), sticker('gaviota'));
const beto = side(sticker('gaviota', chrome), sticker('playero'));
const offered = { speciesId: 'playero', category: 'holographic' as const };
const requested = { speciesId: 'gaviota', category: 'holographic' as const };

describe('tradeProblem', () => {
  it('un intercambio parejo entre especies que ambos registraron es válido', () => {
    expect(tradeProblem(ana, beto, offered, requested)).toBeNull();
  });

  it('hay que ofrecer un cromo, y pedir uno que el otro tenga', () => {
    expect(tradeProblem(side(sticker('playero'), sticker('gaviota')), beto, offered, requested)).toBe('offered-not-chromed');
    expect(tradeProblem(ana, side(sticker('gaviota'), sticker('playero')), offered, requested)).toBe('requested-not-chromed');
  });

  it('solo se recibe el cromo de una especie ya registrada', () => {
    expect(tradeProblem(side(sticker('playero', chrome)), beto, offered, requested)).toBe('proposer-missing-species');
    expect(tradeProblem(ana, side(sticker('gaviota', chrome)), offered, requested)).toBe('receiver-missing-species');
  });

  it('no se pide un cromo que ya se tiene', () => {
    const anaConAmbos = side(sticker('playero', chrome), sticker('gaviota', chrome));
    expect(tradeProblem(anaConAmbos, beto, offered, requested)).toBe('already-has-chrome');
  });

  it('se da uno de igual o mayor categoría', () => {
    expect(tradeProblem(ana, beto, offered, { speciesId: 'gaviota', category: 'gold' })).toBe('unfair-category');
  });

  it('no se intercambia una especie por sí misma', () => {
    expect(tradeProblem(ana, beto, offered, { ...offered })).toBe('same-species');
  });
});

describe('applyTrade', () => {
  it('cada uno recibe el cromo del otro y el suyo vuelve a la versión normal', () => {
    const result = applyTrade(ana, beto, 'playero', 'gaviota', at(9));
    expect(result.proposer).toEqual([
      expect.objectContaining({ speciesId: 'playero', best: null }),
      expect.objectContaining({ speciesId: 'gaviota', best: 'holographic', unlocked: [{ finish: 'holographic', source: 'trade', at: at(9) }] }),
    ]);
    expect(result.receiver).toEqual([
      expect.objectContaining({ speciesId: 'gaviota', best: null }),
      expect.objectContaining({ speciesId: 'playero', best: 'holographic', unlocked: [{ finish: 'holographic', source: 'trade', at: at(9) }] }),
    ]);
  });
});

describe('opciones y propuesta recibida', () => {
  const catalog = [
    species('playero', { albumNumber: 1 }),
    species('gaviota', { albumNumber: 2 }),
    species('zarcillo', { albumNumber: 3, iucn: 'NT' }),
    species('pinguino', { albumNumber: 4, endemic: true }),
  ];
  const entry = (album: AlbumView, id: string) => album.entries.find((e) => e.species.id === id)!;
  const anaAlbum = buildAlbumView(catalog, [sticker('playero', chrome), sticker('gaviota'), sticker('zarcillo'), sticker('pinguino', chrome)]);
  const betoAlbum = buildAlbumView(catalog, [sticker('playero'), sticker('gaviota', chrome)]);
  const trade: TradeProposal = {
    id: 't1', fromUid: 'ana', fromHandle: 'ana', offeredSpeciesId: 'playero', requestedSpeciesId: 'gaviota', status: 'open', createdAt: at(3),
  };

  it('para pedir un cromo se ofrecen los propios', () => {
    expect(offerOptions(anaAlbum, entry(anaAlbum, 'gaviota')).map((e) => e.species.id)).toEqual(['playero', 'pinguino']);
  });

  it('al ofrecer un cromo se pide uno registrado y sin cromo', () => {
    expect(requestOptions(anaAlbum, entry(anaAlbum, 'playero')).map((e) => e.species.id)).toEqual(['gaviota', 'zarcillo']);
  });

  it('quien recibe ve si puede aceptar, con su propio álbum', () => {
    expect(receivedTrade(trade, betoAlbum, 'beto').status).toBe('ready');
    expect(receivedTrade(trade, buildAlbumView(catalog, [sticker('gaviota', chrome)]), 'beto')).toMatchObject({ status: 'blocked', problem: 'receiver-missing-species' });
    expect(receivedTrade(trade, anaAlbum, 'ana').status).toBe('own');
    expect(receivedTrade({ ...trade, status: 'accepted' }, betoAlbum, 'beto').status).toBe('accepted');
  });
});
