import type { AlbumSummary } from './album';
import type { Habitat } from './habitat';

// Logros con medalla (design/project/CatalogoLogros.dc.html y FlujoLogros.dc.html). Todo se
// desbloquea solo al cumplir la condición, y una misma foto puede dar varios a la vez.

/** «Explorador de Ica · 5 especies». */
export const EXPLORER_SPECIES = 5;
/** «Cada 10 especies · medalla 10, 20, 30…». */
export const MILESTONE_STEP = 10;

export type Achievement =
  | { kind: 'firstBird' }
  | { kind: 'explorer' }
  | { kind: 'milestone'; species: number }
  | { kind: 'habitatComplete'; habitat: Habitat }
  | { kind: 'albumComplete' };

/** Identificador estable, para guardarlo y no otorgarlo dos veces. */
export function achievementId(achievement: Achievement): string {
  switch (achievement.kind) {
    case 'firstBird': return 'first-bird';
    case 'explorer': return 'explorer';
    case 'milestone': return `milestone-${achievement.species}`;
    case 'habitatComplete': return `habitat-${achievement.habitat}`;
    case 'albumComplete': return 'album-complete';
  }
}

/** Todos los logros que corresponden a un estado del álbum. */
export function earnedAchievements(summary: AlbumSummary): Achievement[] {
  const earned: Achievement[] = [];
  if (summary.registered >= 1) earned.push({ kind: 'firstBird' });
  if (summary.registered >= EXPLORER_SPECIES) earned.push({ kind: 'explorer' });
  for (let n = MILESTONE_STEP; n <= summary.registered; n += MILESTONE_STEP) earned.push({ kind: 'milestone', species: n });
  for (const h of summary.byHabitat) if (h.total > 0 && h.registered === h.total) earned.push({ kind: 'habitatComplete', habitat: h.habitat });
  if (summary.total > 0 && summary.registered === summary.total) earned.push({ kind: 'albumComplete' });
  return earned;
}

/** Los logros que aparecen al pasar de un estado a otro: los que celebra la app. */
export function newAchievements(before: AlbumSummary, after: AlbumSummary): Achievement[] {
  const had = new Set(earnedAchievements(before).map(achievementId));
  return earnedAchievements(after).filter((a) => !had.has(achievementId(a)));
}

/** Medalla de «cada 10 especies» que sigue y cuánto falta («8 a la medalla de 20»). */
export function nextMilestone(summary: AlbumSummary): { species: number; remaining: number } | null {
  const species = (Math.floor(summary.registered / MILESTONE_STEP) + 1) * MILESTONE_STEP;
  if (species > summary.total) return null;
  return { species, remaining: species - summary.registered };
}
