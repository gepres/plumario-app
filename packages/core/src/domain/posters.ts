import { SPECIES_PER_POSTER, type HabitatProgress } from './album';
import type { AlbumEntry, AlbumView } from './album-view';
import type { Habitat } from './habitat';
import type { SpeciesId } from './species';

// Pósteres (design/project/FlujoPoster10.dc.html y PosterHabitat.dc.html): uno cada 10 especies con
// 10 stickers al azar que se mezclan y se guardan, y uno por hábitat, siempre visible, que se descarga
// al completar el hábitat.

/** Pósteres de «cada 10 especies» que el usuario puede armar. */
export function speciesPostersAvailable(registered: number): number {
  return Math.floor(registered / SPECIES_PER_POSTER);
}

/** El póster del hábitat se descarga (PNG y PDF A3) al completar todas sus especies. */
export function isHabitatPosterUnlocked(progress: HabitatProgress): boolean {
  return progress.total > 0 && progress.registered === progress.total;
}

// Generador pseudoaleatorio con semilla (mulberry32): la misma semilla da la misma mezcla, así un
// póster guardado se puede volver a dibujar igual, y «Mezclar» solo cambia la semilla.
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Elige `count` especies distintas de las registradas, en un orden que depende solo de la semilla. */
export function pickPosterSpecies(registered: readonly SpeciesId[], seed: number, count = SPECIES_PER_POSTER): SpeciesId[] {
  const pool = [...registered].sort();
  const next = random(seed);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/** «Título de hasta 22 caracteres» (FlujoPoster10). */
export const POSTER_TITLE_MAX = 22;

export type PosterTheme = 'light' | 'dark';

/** Un póster guardado: queda fijo con su número, sus especies y su mezcla (users/{uid}/posters). */
export type SavedPoster = {
  id: string;
  kind: 'species' | 'habitat';
  /** El número del póster «cada 10» (1, 2, 3…); null en los de hábitat. */
  number: number | null;
  habitat: Habitat | null;
  speciesIds: readonly SpeciesId[];
  seed: number;
  theme: PosterTheme;
  title: string;
  savedAt: Date;
};

/**
 * Las especies del póster N (FlujoPoster10, «Cómo se eligen los 10»):
 * - Póster 1: las 10 primeras especies registradas; mezclar solo cambia el orden.
 * - Desde el 2: 10 al azar entre todas, con al menos una de cada hábitat que tenga.
 */
export function posterSpecies(registered: readonly AlbumEntry[], number: number, seed: number): SpeciesId[] {
  const owned = registered.filter((e) => e.sticker).sort((a, b) => a.sticker!.completedAt.getTime() - b.sticker!.completedAt.getTime());
  if (number <= 1) return pickPosterSpecies(owned.slice(0, SPECIES_PER_POSTER).map((e) => e.species.id), seed);
  const next = random(seed ^ 0x9e3779b9);
  // Una al azar de cada hábitat que tenga, y el resto al azar entre todas las demás.
  const byHabitat = new Map<string, AlbumEntry[]>();
  for (const e of owned) if (e.species.habitat) byHabitat.set(e.species.habitat, [...(byHabitat.get(e.species.habitat) ?? []), e]);
  const chosen = new Set<SpeciesId>();
  for (const entries of [...byHabitat.values()]) {
    if (chosen.size >= SPECIES_PER_POSTER) break;
    chosen.add(entries[Math.floor(next() * entries.length)]!.species.id);
  }
  const rest = pickPosterSpecies(owned.map((e) => e.species.id).filter((id) => !chosen.has(id)), seed, SPECIES_PER_POSTER - chosen.size);
  return pickPosterSpecies([...chosen, ...rest], seed);
}

export type SpeciesPosterSlot =
  | { status: 'saved'; number: number; poster: SavedPoster }
  | { status: 'ready'; number: number }
  | { status: 'next'; number: number; registered: number; goal: number };

export type HabitatPosterSlot = { habitat: Habitat; registered: number; total: number; unlocked: boolean; saved: SavedPoster | null };

export type PostersView = { species: SpeciesPosterSlot[]; habitats: HabitatPosterSlot[] };

/** RecompensasPosteres: los de cada 10 (guardados, listos para armar y el próximo) y uno por hábitat. */
export function postersView(album: AlbumView, saved: readonly SavedPoster[]): PostersView {
  const available = speciesPostersAvailable(album.registered);
  const species: SpeciesPosterSlot[] = [];
  for (let number = 1; number <= available; number++) {
    const poster = saved.find((p) => p.kind === 'species' && p.number === number);
    species.push(poster ? { status: 'saved', number, poster } : { status: 'ready', number });
  }
  const goal = (available + 1) * SPECIES_PER_POSTER;
  if (goal <= album.total) species.push({ status: 'next', number: available + 1, registered: album.registered, goal });
  const habitats = album.habitats
    .filter((h) => h.total > 0)
    .map((h) => ({
      habitat: h.habitat,
      registered: h.registered,
      total: h.total,
      unlocked: isHabitatPosterUnlocked(h),
      saved: saved.find((p) => p.kind === 'habitat' && p.habitat === h.habitat) ?? null,
    }));
  return { species, habitats };
}
