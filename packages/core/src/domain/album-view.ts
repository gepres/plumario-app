import { isInAlbum } from './album';
import { categoryOf, type CardCategory } from './card';
import { HABITATS, type Habitat } from './habitat';
import type { Species } from './species';
import type { Sticker } from './sticker';

// Lo que muestran Álbum y las páginas de hábitat (design/project/Album.dc.html, HabitatLitoral):
// cada especie del álbum con su sticker si ya lo tiene, y el avance por hábitat.

export type AlbumEntry = {
  species: Species;
  /** null mientras la especie está en sombra. */
  sticker: Sticker | null;
  /** El acabado que tendría su cromo; el sticker normal no lo muestra. */
  category: CardCategory;
};

export type HabitatSection = {
  habitat: Habitat;
  total: number;
  registered: number;
  /** En orden de álbum (número de sticker). */
  entries: AlbumEntry[];
};

export type AlbumView = {
  registered: number;
  total: number;
  /** Todas las especies del álbum en orden de número, también las que aún no tienen hábitat. */
  entries: AlbumEntry[];
  habitats: HabitatSection[];
};

const byAlbumNumber = (a: AlbumEntry, b: AlbumEntry) =>
  (a.species.albumNumber ?? Number.MAX_SAFE_INTEGER) - (b.species.albumNumber ?? Number.MAX_SAFE_INTEGER) ||
  a.species.commonName.localeCompare(b.species.commonName, 'es');

export function buildAlbumView(catalog: readonly Species[], stickers: readonly Sticker[]): AlbumView {
  const stickerBySpecies = new Map(stickers.map((s) => [s.speciesId, s]));
  const entries = catalog
    .filter(isInAlbum)
    .map((species) => ({ species, sticker: stickerBySpecies.get(species.id) ?? null, category: categoryOf(species) }))
    .sort(byAlbumNumber);
  const habitats = HABITATS.map((habitat) => {
    const inHabitat = entries.filter((e) => e.species.habitat === habitat);
    return { habitat, total: inHabitat.length, registered: inHabitat.filter((e) => e.sticker).length, entries: inHabitat };
  });
  return { registered: entries.filter((e) => e.sticker).length, total: entries.length, entries, habitats };
}

/**
 * Las figuritas de la tarjeta de un hábitat en Álbum: primero las que tiene, de la más reciente a
 * la más antigua, y después las que le faltan, en orden de álbum.
 */
export function habitatPreview(section: HabitatSection, count: number): AlbumEntry[] {
  const owned = section.entries
    .filter((e) => e.sticker)
    .sort((a, b) => b.sticker!.completedAt.getTime() - a.sticker!.completedAt.getTime());
  return [...owned, ...section.entries.filter((e) => !e.sticker)].slice(0, count);
}

export type AlbumFilter = 'all' | 'owned' | 'missing';

/** «Todas · Tengo · Me faltan» de la página de hábitat. */
export function filterEntries(entries: readonly AlbumEntry[], filter: AlbumFilter): AlbumEntry[] {
  if (filter === 'owned') return entries.filter((e) => e.sticker);
  if (filter === 'missing') return entries.filter((e) => !e.sticker);
  return [...entries];
}

const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

/** «Buscar entre 294 aves»: por nombre común o científico, sin importar tildes ni mayúsculas, o por número. */
export function searchEntries(entries: readonly AlbumEntry[], query: string): AlbumEntry[] {
  const q = fold(query);
  if (!q) return [...entries];
  const asNumber = /^\d+$/.test(q) ? Number(q) : null;
  return entries.filter(
    ({ species }) =>
      fold(species.commonName).includes(q) || fold(species.scientificName).includes(q) || (asNumber !== null && species.albumNumber === asNumber),
  );
}

/** El número del sticker como lo imprime el álbum: «011». */
export const formatAlbumNumber = (albumNumber: number | null) => (albumNumber === null ? '—' : String(albumNumber).padStart(3, '0'));

export type Seal = 'threatened' | 'emblematic' | 'endemic' | 'nearThreatened';

const SEAL_CATEGORY: Record<Seal, CardCategory> = { threatened: 'diamond', emblematic: 'ruby', endemic: 'gold', nearThreatened: 'silver' };

/**
 * «Si cumple varias, gana la más alta. Lo demás queda como sello en la ficha de la especie»
 * (CategoriasCromos): los criterios que cumple además del que decide su categoría.
 */
export function sealsOf(species: Pick<Species, 'iucn' | 'endemic' | 'emblematic' | 'threatened'>): Seal[] {
  const met: Seal[] = [];
  if (species.threatened || ['VU', 'EN', 'CR'].includes(species.iucn ?? '')) met.push('threatened');
  if (species.emblematic) met.push('emblematic');
  if (species.endemic) met.push('endemic');
  if (species.iucn === 'NT') met.push('nearThreatened');
  const category = categoryOf(species);
  return met.filter((seal) => SEAL_CATEGORY[seal] !== category);
}
