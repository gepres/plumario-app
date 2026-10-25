import { achievementId, earnedAchievements, EXPLORER_SPECIES, MILESTONE_STEP, type Achievement } from './achievements';
import type { AlbumSummary } from './album';
import type { AlbumEntry, AlbumView } from './album-view';
import { CATEGORY_RANK, type CardCategory } from './card';
import type { Habitat } from './habitat';

// Lo que muestra Recompensas (design/project/Main.dc.html y RecompensasStickers.dc.html).

export type MedalProgress = { achievement: Achievement; current: number; goal: number };

export type RewardsView = {
  registered: number;
  total: number;
  chromes: number;
  /** De la más reciente a la más antigua; sin fecha si el registro del logro aún no llegó. */
  earned: { achievement: Achievement; earnedAt: Date | null }[];
  /** «La más cercana»: la medalla de colección con más avance que falta. */
  closest: MedalProgress | null;
  /** Una por hábitat del álbum que aún no se completa. */
  habitats: (MedalProgress & { habitat: Habitat })[];
  /** «Bronce · álbum», mientras no se complete. */
  album: MedalProgress | null;
};

/** El resumen del álbum que usan las reglas de logros, a partir de la vista del álbum. */
export function summaryOf(album: AlbumView): AlbumSummary {
  return {
    registered: album.registered,
    total: album.total,
    byHabitat: album.habitats.map(({ habitat, registered, total }) => ({ habitat, registered, total })),
    nextPoster: null,
  };
}

/**
 * Las medallas obtenidas salen de las reglas (earnedAchievements) sobre el álbum, y la fecha, de
 * los logros guardados: así se ven aunque el servidor todavía no haya escrito alguno.
 */
export function rewardsView(album: AlbumView, records: readonly { achievement: Achievement; earnedAt: Date }[]): RewardsView {
  const dates = new Map(records.map((r) => [achievementId(r.achievement), r.earnedAt]));
  const earnedNow = earnedAchievements(summaryOf(album));
  const earnedIds = new Set(earnedNow.map(achievementId));
  // Un logro guardado sigue contando aunque hoy ya no se cumpla (p. ej., tras un intercambio).
  const extra = records.filter((r) => !earnedIds.has(achievementId(r.achievement))).map((r) => r.achievement);
  const earned = [...earnedNow, ...extra]
    .map((achievement) => ({ achievement, earnedAt: dates.get(achievementId(achievement)) ?? null }))
    .sort((a, b) => (b.earnedAt?.getTime() ?? 0) - (a.earnedAt?.getTime() ?? 0));
  const has = (a: Achievement) => earned.some((e) => achievementId(e.achievement) === achievementId(a));

  const r = album.registered;
  const nextMilestone = (Math.floor(r / MILESTONE_STEP) + 1) * MILESTONE_STEP;
  const candidates: MedalProgress[] = [
    { achievement: { kind: 'firstBird' }, current: Math.min(r, 1), goal: 1 },
    { achievement: { kind: 'explorer' }, current: Math.min(r, EXPLORER_SPECIES), goal: EXPLORER_SPECIES },
  ];
  if (nextMilestone <= album.total) candidates.push({ achievement: { kind: 'milestone', species: nextMilestone }, current: r, goal: nextMilestone });
  const closest = candidates.filter((c) => !has(c.achievement)).sort((a, b) => b.current / b.goal - a.current / a.goal || a.goal - b.goal)[0] ?? null;

  const habitats = album.habitats
    .filter((h) => h.total > 0)
    .map((h) => ({ habitat: h.habitat, achievement: { kind: 'habitatComplete', habitat: h.habitat } as Achievement, current: h.registered, goal: h.total }))
    .filter((h) => !has(h.achievement));
  const albumMedal: Achievement = { kind: 'albumComplete' };

  return {
    registered: r,
    total: album.total,
    chromes: album.entries.filter((e) => e.sticker?.chrome).length,
    earned,
    closest,
    habitats,
    album: has(albumMedal) ? null : { achievement: albumMedal, current: r, goal: album.total },
  };
}

export const CATEGORIES: readonly CardCategory[] = ['holographic', 'silver', 'gold', 'ruby', 'diamond'];

export type CategoryProgress = {
  category: CardCategory;
  /** Especies del álbum con esa categoría. */
  total: number;
  /** De esas, las que ya registró. */
  registered: number;
  /** Y las que ya tiene en cromo. */
  chromed: number;
};

export type ChromesView = {
  categories: CategoryProgress[];
  /** Los cromos obtenidos, del más reciente al más antiguo. */
  chromed: AlbumEntry[];
  /** «Casi listo»: la registrada sin cromo con más fotos validadas. */
  closest: AlbumEntry | null;
  /** Las demás registradas sin cromo, de la categoría más alta a la más baja: para pedir en intercambio. */
  toTrade: AlbumEntry[];
  /** Cuántas registradas no tienen cromo todavía. */
  withoutChrome: number;
};

export function chromesView(album: AlbumView): ChromesView {
  const categories = CATEGORIES.map((category) => {
    const inCategory = album.entries.filter((e) => e.category === category);
    return {
      category,
      total: inCategory.length,
      registered: inCategory.filter((e) => e.sticker).length,
      chromed: inCategory.filter((e) => e.sticker?.chrome).length,
    };
  });
  const chromed = album.entries.filter((e) => e.sticker?.chrome).sort((a, b) => b.sticker!.chrome!.at.getTime() - a.sticker!.chrome!.at.getTime());
  const without = album.entries.filter((e) => e.sticker && !e.sticker.chrome);
  const closest = [...without].sort((a, b) => b.sticker!.validPhotos - a.sticker!.validPhotos || CATEGORY_RANK[b.category] - CATEGORY_RANK[a.category])[0] ?? null;
  const toTrade = without.filter((e) => e !== closest).sort((a, b) => CATEGORY_RANK[b.category] - CATEGORY_RANK[a.category]);
  return { categories, chromed, closest, toTrade, withoutChrome: without.length };
}
