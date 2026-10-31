import { MILESTONE_STEP } from './achievements';
import type { AlbumEntry, AlbumView } from './album-view';
import type { Habitat } from './habitat';
import { regionById } from './regions';
import type { RegionId } from './species';

// Inicio (design/project/Inicio.dc.html e InicioVacio.dc.html).

/** «Nuevo» en las últimas aves: lo que se consiguió hace menos de dos días. */
const NEW_FOR_MS = 2 * 864e5;

export type HomeView =
  | {
      kind: 'empty';
      /** «Fáciles de ver en la ciudad». */
      easy: AlbumEntry[];
    }
  | {
      kind: 'started';
      /** «Tus últimas aves»: las tres más recientes (completadas o cromadas), con si son nuevas. */
      latest: { entry: AlbumEntry; isNew: boolean }[];
      /** «Por descubrir en el litoral»: del hábitat de la última ave, las que faltan en orden de álbum. */
      discover: { habitat: Habitat; entries: AlbumEntry[]; remaining: number } | null;
      /** «8 especies a la medalla de 20». */
      nextMilestone: { goal: number; remaining: number } | null;
    };

/** Cuándo se consiguió por última vez algo de esa especie: el cromo o el sticker. */
const lastChange = (e: AlbumEntry) => Math.max(e.sticker!.completedAt.getTime(), ...e.sticker!.unlocked.map((u) => u.at.getTime()));

export function homeView(album: AlbumView, regionId: RegionId, now: Date): HomeView {
  const owned = album.entries.filter((e) => e.sticker);
  if (owned.length === 0) {
    const easyIds = regionById(regionId)?.easySpecies ?? [];
    const easy = easyIds.map((id) => album.entries.find((e) => e.species.id === id)).filter((e): e is AlbumEntry => !!e).slice(0, 3);
    return { kind: 'empty', easy };
  }

  const latest = [...owned].sort((a, b) => lastChange(b) - lastChange(a)).slice(0, 3).map((entry) => ({ entry, isNew: now.getTime() - lastChange(entry) < NEW_FOR_MS }));

  // El hábitat de la última ave con hábitat; si ya está completo, el siguiente que tenga faltantes.
  const lastHabitat = latest.find((l) => l.entry.species.habitat)?.entry.species.habitat ?? null;
  const sections = album.habitats.filter((h) => h.total > h.registered);
  const section = sections.find((h) => h.habitat === lastHabitat) ?? sections[0];
  const missing = section?.entries.filter((e) => !e.sticker) ?? [];
  const discover = section ? { habitat: section.habitat, entries: missing.slice(0, 3), remaining: Math.max(0, missing.length - 3) } : null;

  const goal = (Math.floor(album.registered / MILESTONE_STEP) + 1) * MILESTONE_STEP;
  const nextMilestone = goal <= album.total ? { goal, remaining: goal - album.registered } : null;

  return { kind: 'started', latest, discover, nextMilestone };
}
