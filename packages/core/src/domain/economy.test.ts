import { describe, expect, it } from 'vitest';

import { at, sticker } from '../testing';
import {
  EMPTY_WALLET,
  FINISH_PRICES,
  NO_PIECES,
  PACK_TABLE,
  applyPackPiece,
  applyPurchase,
  coveredMilestonePayment,
  duplicatesByFinish,
  limaMonth,
  nextFinish,
  noReward,
  packDesign,
  packFinish,
  packSpecies,
  premiumAvailableAt,
  purchaseProblem,
  recyclePiece,
  rewardObservation,
  type Wallet,
} from './economy';
import type { UnlockedFinish } from './sticker';

const unlocked = (finish: UnlockedFinish['finish'], source: UnlockedFinish['source']): UnlockedFinish => ({ finish, source, at: at(2) });
const wallet = (feathers: number, overrides: Partial<Wallet> = {}): Wallet => ({ ...EMPTY_WALLET, feathers, ...overrides });

describe('plumas de una observación', () => {
  it('cada observación válida da 1 pluma', () => {
    const reward = rewardObservation(EMPTY_WALLET, sticker('garza'), null);
    expect(reward.feathers).toBe(1);
    expect(reward.wallet.feathers).toBe(1);
    expect(reward.covered).toBeNull();
  });

  it('sin observación no cambia nada', () => {
    expect(noReward(wallet(7))).toEqual({ wallet: wallet(7), feathers: 0, covered: null, pack: null });
  });

  it('un hito cubierto por suerte paga sus plumas', () => {
    const reward = rewardObservation(EMPTY_WALLET, sticker('garza', { best: 'holographic', unlocked: [unlocked('holographic', 'luck')] }), 3);
    expect(reward.covered).toEqual({ finish: 'holographic', source: 'luck', feathers: 3 });
    expect(reward.feathers).toBe(4);
  });

  it('un hito cubierto por un sobre paga sus plumas, aunque el sobre trajera más', () => {
    const covered = sticker('garza', { best: 'gold', unlocked: [unlocked('gold', 'pack')] });
    expect(coveredMilestonePayment(covered, 5)).toEqual({ finish: 'silver', source: 'pack', feathers: 5 });
    expect(coveredMilestonePayment(covered, 10)).toEqual({ finish: 'gold', source: 'pack', feathers: 10 });
  });

  it('un hito cubierto por una compra no paga: sería un reembolso', () => {
    const bought = sticker('garza', { best: 'silver', unlocked: [unlocked('holographic', 'purchase'), unlocked('silver', 'purchase')] });
    expect(coveredMilestonePayment(bought, 3)).toBeNull();
    expect(coveredMilestonePayment(bought, 5)).toBeNull();
    expect(rewardObservation(EMPTY_WALLET, bought, 5).feathers).toBe(1);
  });

  it('cuenta quién cubrió ese hito, no el último acabado', () => {
    const mixed = sticker('garza', { best: 'gold', unlocked: [unlocked('holographic', 'purchase'), unlocked('gold', 'pack')] });
    expect(coveredMilestonePayment(mixed, 3)).toBeNull();
    expect(coveredMilestonePayment(mixed, 10)?.feathers).toBe(10);
  });

  it('paga 3, 5, 10, 25 y 60 de holográfico a diamante', () => {
    const top = sticker('garza', { best: 'diamond', unlocked: [unlocked('diamond', 'pack')] });
    expect([3, 5, 10, 20, 35].map((n) => coveredMilestonePayment(top, n)?.feathers)).toEqual([3, 5, 10, 25, 60]);
  });
});

describe('sobres', () => {
  it('cada 3 observaciones sale exactamente un sobre, con esas 3 aves', () => {
    const first = rewardObservation(EMPTY_WALLET, sticker('garza'), null);
    const second = rewardObservation(first.wallet, sticker('pelicano'), null);
    const third = rewardObservation(second.wallet, sticker('garza'), null);
    expect([first.pack, second.pack]).toEqual([null, null]);
    expect(second.wallet.packSpecies).toEqual(['garza', 'pelicano']);
    expect(third.pack).toEqual(['garza', 'pelicano', 'garza']);
    expect(third.wallet.packSpecies).toEqual([]);
  });

  it('sus cuatro probabilidades suman 100 %', () => {
    expect(PACK_TABLE.reduce((sum, row) => sum + row.chance, 0)).toBeCloseTo(1);
    expect(PACK_TABLE.map((row) => row.chance)).toEqual([0.75, 0.2, 0.04, 0.01]);
  });

  it('el sorteo respeta la tabla', () => {
    expect([0, 0.7499, 0.75, 0.9499, 0.95, 0.9899, 0.99, 0.9999].map(packFinish)).toEqual(['silver', 'silver', 'gold', 'gold', 'ruby', 'ruby', 'diamond', 'diamond']);
  });

  it('nunca trae holográficos', () => {
    expect(PACK_TABLE.map((row) => row.finish)).not.toContain('holographic');
  });

  it('solo trae piezas de sus aves', () => {
    const birds = ['garza', 'pelicano', 'condor'];
    expect([0, 0.33, 0.34, 0.66, 0.67, 0.999].map((roll) => packSpecies(birds, roll))).toEqual(['garza', 'garza', 'pelicano', 'pelicano', 'condor', 'condor']);
  });

  it('el diseño sale de los 3, y es solo apariencia', () => {
    expect([0, 0.34, 0.67].map(packDesign)).toEqual(['nasca', 'pelicans', 'paracas']);
  });

  it('una pieza que supera tu acabado se pega en el álbum', () => {
    const result = applyPackPiece({ sticker: sticker('garza', { best: 'holographic', ownBest: 'holographic' }), counts: NO_PIECES, finish: 'gold', at: at(3) });
    expect(result.upgraded).toBe(true);
    expect(result.sticker.best).toBe('gold');
    expect(result.sticker.ownBest).toBe('gold');
    expect(result.sticker.unlocked.at(-1)?.source).toBe('pack');
    expect(result.counts).toEqual(NO_PIECES);
  });

  it('una pieza que no lo supera queda como repetida y el álbum no retrocede', () => {
    const before = sticker('garza', { best: 'gold', ownBest: 'gold' });
    for (const finish of ['silver', 'gold'] as const) {
      const result = applyPackPiece({ sticker: before, counts: NO_PIECES, finish, at: at(3) });
      expect(result.upgraded).toBe(false);
      expect(result.sticker).toBe(before);
      expect(result.counts[finish]).toBe(1);
    }
  });

  it('una pieza no suma observaciones ni cobra hitos', () => {
    const before = sticker('garza', { observations: 4, claimedMilestone: 3 });
    const result = applyPackPiece({ sticker: before, counts: NO_PIECES, finish: 'diamond', at: at(3) });
    expect(result.sticker.observations).toBe(4);
    expect(result.sticker.claimedMilestone).toBe(3);
  });
});

describe('reciclar', () => {
  it('paga 2, 5, 12 y 30 plumas, de plata a diamante', () => {
    const counts = { silver: 1, gold: 1, ruby: 1, diamond: 1 };
    expect((['silver', 'gold', 'ruby', 'diamond'] as const).map((finish) => recyclePiece(EMPTY_WALLET, counts, finish)?.feathers)).toEqual([2, 5, 12, 30]);
  });

  it('gasta una sola pieza y suma al saldo', () => {
    const result = recyclePiece(wallet(4), { ...NO_PIECES, gold: 2 }, 'gold');
    expect(result?.counts.gold).toBe(1);
    expect(result?.wallet.feathers).toBe(9);
  });

  it('no se recicla lo que no se tiene', () => {
    expect(recyclePiece(wallet(4), NO_PIECES, 'gold')).toBeNull();
  });
});

describe('comprar', () => {
  const now = new Date('2026-11-15T15:00:00Z');
  const registered = sticker('garza');

  it('sube al acabado siguiente y cobra su precio', () => {
    expect(purchaseProblem({ sticker: registered, wallet: wallet(6), finish: 'holographic', at: now })).toBeNull();
    const result = applyPurchase({ sticker: registered, wallet: wallet(9), finish: 'holographic', at: now });
    expect(result.sticker.best).toBe('holographic');
    expect(result.sticker.unlocked.at(-1)?.source).toBe('purchase');
    expect(result.wallet.feathers).toBe(3);
  });

  it('los precios son 6, 10, 20, 50 y 120', () => {
    expect(Object.values(FINISH_PRICES)).toEqual([6, 10, 20, 50, 120]);
  });

  it('rechaza aves sin registrar: la foto es la única forma de sumar un ave', () => {
    expect(purchaseProblem({ sticker: null, wallet: wallet(500), finish: 'holographic', at: now })).toBe('not-registered');
  });

  it('rechaza saltos de nivel, también por un doble toque', () => {
    expect(purchaseProblem({ sticker: registered, wallet: wallet(500), finish: 'gold', at: now })).toBe('not-next');
    const already = sticker('garza', { best: 'silver' });
    expect(purchaseProblem({ sticker: already, wallet: wallet(500), finish: 'silver', at: now })).toBe('not-next');
  });

  it('no hay nada que comprar sobre el diamante', () => {
    expect(nextFinish('diamond')).toBeNull();
    expect(purchaseProblem({ sticker: sticker('garza', { best: 'diamond' }), wallet: wallet(500), finish: 'diamond', at: now })).toBe('top-finish');
  });

  it('rechaza si no alcanzan las plumas, también con saldo negativo', () => {
    expect(purchaseProblem({ sticker: registered, wallet: wallet(5), finish: 'holographic', at: now })).toBe('not-enough');
    expect(purchaseProblem({ sticker: registered, wallet: wallet(-3), finish: 'holographic', at: now })).toBe('not-enough');
  });

  it('solo 1 rubí o diamante al mes', () => {
    const gold = sticker('garza', { best: 'gold' });
    const bought = applyPurchase({ sticker: gold, wallet: wallet(500), finish: 'ruby', at: now });
    const other = sticker('pelicano', { best: 'gold' });
    expect(purchaseProblem({ sticker: other, wallet: bought.wallet, finish: 'ruby', at: now })).toBe('monthly-limit');
    const ruby = sticker('condor', { best: 'ruby' });
    expect(purchaseProblem({ sticker: ruby, wallet: bought.wallet, finish: 'diamond', at: now })).toBe('monthly-limit');
  });

  it('el tope no alcanza a los acabados bajos', () => {
    const limited = wallet(500, { premiumMonth: limaMonth(now) });
    expect(purchaseProblem({ sticker: sticker('garza', { best: 'silver' }), wallet: limited, finish: 'gold', at: now })).toBeNull();
    const bought = applyPurchase({ sticker: sticker('garza', { best: 'silver' }), wallet: limited, finish: 'gold', at: now });
    expect(bought.wallet.premiumMonth).toBe(limaMonth(now));
  });

  it('el mes siguiente vuelve el cupo', () => {
    const limited = wallet(500, { premiumMonth: limaMonth(now) });
    expect(premiumAvailableAt(limited, now)?.toISOString()).toBe('2026-12-01T12:00:00.000Z');
    const later = new Date('2026-12-01T06:00:00Z');
    expect(purchaseProblem({ sticker: sticker('garza', { best: 'gold' }), wallet: limited, finish: 'ruby', at: later })).toBeNull();
    expect(premiumAvailableAt(limited, later)).toBeNull();
  });

  it('el mes es el de Lima: la medianoche UTC del 1 sigue siendo el mes anterior', () => {
    expect(limaMonth(new Date('2026-12-01T03:00:00Z'))).toBe(limaMonth(new Date('2026-11-30T12:00:00Z')));
    expect(limaMonth(new Date('2026-12-01T06:00:00Z'))).not.toBe(limaMonth(new Date('2026-11-30T12:00:00Z')));
  });

  it('diciembre pasa a enero del año siguiente', () => {
    const december = new Date('2026-12-15T15:00:00Z');
    expect(premiumAvailableAt(wallet(0, { premiumMonth: limaMonth(december) }), december)?.toISOString()).toBe('2027-01-01T12:00:00.000Z');
  });

  it('comprar no suma observaciones ni cobra hitos', () => {
    const before = sticker('garza', { observations: 2, claimedMilestone: 0 });
    const { sticker: after } = applyPurchase({ sticker: before, wallet: wallet(6), finish: 'holographic', at: now });
    expect(after.observations).toBe(2);
    expect(after.claimedMilestone).toBe(0);
  });
});

describe('repetidas', () => {
  it('se agrupan por acabado, de más a menos valioso, sin los que no hay', () => {
    const groups = duplicatesByFinish([
      { speciesId: 'garza', counts: { ...NO_PIECES, silver: 2 } },
      { speciesId: 'pelicano', counts: { ...NO_PIECES, silver: 1, ruby: 1 } },
      { speciesId: 'condor', counts: NO_PIECES },
    ]);
    expect(groups).toEqual([
      { finish: 'ruby', total: 1, pieces: [{ speciesId: 'pelicano', count: 1 }] },
      { finish: 'silver', total: 3, pieces: [{ speciesId: 'garza', count: 2 }, { speciesId: 'pelicano', count: 1 }] },
    ]);
  });
});
