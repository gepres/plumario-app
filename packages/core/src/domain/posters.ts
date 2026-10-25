import { SPECIES_PER_POSTER, type HabitatProgress } from './album';
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
