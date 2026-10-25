import { describe, expect, it } from 'vitest';

import { at, sticker } from '../testing';
import type { Sticker } from './sticker';
import { applyTrade, tradeProblem, type TradeSide } from './trade';

const chrome = { source: 'luck' as const, at: at(2) };
const side = (...stickers: Sticker[]): TradeSide => ({ stickers: new Map(stickers.map((s) => [s.speciesId, s])) });

// Ana ofrece su cromo de Playero (holográfico) y pide el de Gaviota (holográfico) a Beto.
const ana = side(sticker('playero', { chrome }), sticker('gaviota'));
const beto = side(sticker('gaviota', { chrome }), sticker('playero'));
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
    expect(tradeProblem(side(sticker('playero', { chrome })), beto, offered, requested)).toBe('proposer-missing-species');
    expect(tradeProblem(ana, side(sticker('gaviota', { chrome })), offered, requested)).toBe('receiver-missing-species');
  });

  it('no se pide un cromo que ya se tiene', () => {
    const anaConAmbos = side(sticker('playero', { chrome }), sticker('gaviota', { chrome }));
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
      expect.objectContaining({ speciesId: 'playero', chrome: null }),
      expect.objectContaining({ speciesId: 'gaviota', chrome: { source: 'trade', at: at(9) } }),
    ]);
    expect(result.receiver).toEqual([
      expect.objectContaining({ speciesId: 'gaviota', chrome: null }),
      expect.objectContaining({ speciesId: 'playero', chrome: { source: 'trade', at: at(9) } }),
    ]);
  });
});
