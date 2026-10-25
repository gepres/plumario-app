import { describe, expect, it } from 'vitest';

import { species, sticker } from '../testing';
import { achievementId, earnedAchievements, newAchievements, nextMilestone } from './achievements';
import { summarizeAlbum } from './album';

// Un catálogo de 24 aves: 20 de litoral y 4 de humedales.
const catalog = [
  ...Array.from({ length: 20 }, (_, i) => species(`l${i}`)),
  ...Array.from({ length: 4 }, (_, i) => species(`h${i}`, { habitat: 'wetlands' })),
];
const summaryWith = (ids: string[]) => summarizeAlbum(catalog, ids.map((id) => sticker(id)));
const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

describe('earnedAchievements', () => {
  it('sin stickers no hay logros', () => {
    expect(earnedAchievements(summaryWith([]))).toEqual([]);
  });

  it('el primer sticker da «Mi primera ave»; 5 especies, «Explorador de Ica»', () => {
    expect(earnedAchievements(summaryWith(['l0'])).map(achievementId)).toEqual(['first-bird']);
    expect(earnedAchievements(summaryWith(ids('l', 5))).map(achievementId)).toEqual(['first-bird', 'explorer']);
  });

  it('una medalla cada 10 especies', () => {
    expect(earnedAchievements(summaryWith(ids('l', 20))).map(achievementId)).toEqual([
      'first-bird', 'explorer', 'milestone-10', 'milestone-20', 'habitat-coast',
    ]);
  });

  it('completar un hábitat y el álbum entero', () => {
    const all = earnedAchievements(summaryWith([...ids('l', 20), ...ids('h', 4)])).map(achievementId);
    expect(all).toContain('habitat-wetlands');
    expect(all).toContain('album-complete');
  });
});

describe('newAchievements', () => {
  it('solo devuelve lo que se desbloqueó con este cambio (una foto puede dar varios)', () => {
    const before = summaryWith([...ids('l', 9), ...ids('h', 3)]);
    const after = summaryWith([...ids('l', 9), ...ids('h', 4)]);
    expect(newAchievements(before, after).map(achievementId)).toEqual(['habitat-wetlands']);
    const tenth = summaryWith([...ids('l', 10), ...ids('h', 4)]);
    expect(newAchievements(after, tenth).map(achievementId)).toEqual([]);
  });
});

describe('nextMilestone', () => {
  it('con 12 especies faltan 8 para la medalla de 20, como en el diseño', () => {
    expect(nextMilestone(summaryWith(ids('l', 12)))).toEqual({ species: 20, remaining: 8 });
  });
  it('no hay siguiente medalla si el catálogo no alcanza', () => {
    expect(nextMilestone(summaryWith([...ids('l', 20), ...ids('h', 1)]))).toBeNull();
  });
});
