import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { PixelRatio, View } from 'react-native';

import { formatAlbumNumber, pickPosterSpecies, posterSpecies, SPECIES_PER_POSTER, type AlbumEntry, type AlbumView, type HabitatSection, type PosterTheme } from '@plumario/core';
import { PosterFrame, type HabitatPosterCell, type PosterSticker } from '@plumario/ui';

import { formatShortDate } from '@/constants/cards';
import { stickerTint } from '@/constants/habitats';
import { POSTER_EXPORT_WIDTH, type CaptureTarget } from '@/utils/export-poster';

// Del álbum a lo que dibujan los pósteres de @plumario/ui.

export const DEFAULT_POSTER_TITLE = 'Mis aves de Ica';

function toSticker(entry: AlbumEntry): PosterSticker {
  return {
    figure: entry.species.figure,
    name: entry.species.commonName,
    number: formatAlbumNumber(entry.species.albumNumber),
    tint: stickerTint(entry.species.habitat),
    finish: entry.sticker?.chrome ? entry.category : 'normal',
  };
}

const monthYear = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' });

/** Las props del póster de cada 10 (Poster10): sus especies, textos y pie. */
export function speciesPosterProps(
  album: AlbumView,
  poster: { number: number; seed: number; theme: PosterTheme; title: string; speciesIds?: readonly string[]; savedAt?: Date },
  collector: string,
) {
  const goal = poster.number * SPECIES_PER_POSTER;
  const ready = album.registered >= goal;
  const byId = new Map(album.entries.map((e) => [e.species.id, e]));
  const ids = poster.speciesIds ?? (ready ? posterSpecies(album.entries, poster.number, poster.seed) : []);
  const entries = ids.map((id) => byId.get(id)).filter((e): e is AlbumEntry => !!e);
  const owned = album.entries.filter((e) => e.sticker).sort((a, b) => a.sticker!.completedAt.getTime() - b.sticker!.completedAt.getTime());
  const from = owned.length ? monthYear.format(owned[0]!.sticker!.completedAt) : '';
  const to = owned.length ? monthYear.format(owned[Math.min(owned.length, SPECIES_PER_POSTER) - 1]!.sticker!.completedAt) : '';
  const span = from === to ? from : `${from} a ${to}`;
  return {
    theme: poster.theme,
    number: poster.number,
    title: poster.title || DEFAULT_POSTER_TITLE,
    subtitle: !ready
      ? `Se arma al llegar a ${goal} especies, con 10 de tus stickers al azar`
      : poster.number === 1
        ? `Mis 10 primeras especies${span ? ` · ${span}` : ''}`
        : '10 de mis stickers, elegidos al azar',
    meta: ready ? `${goal} especies` : 'en camino',
    footer: ready ? `Póster ${poster.number} · ${formatShortDate(poster.savedAt ?? new Date())} · ${goal} especies` : `Te faltan ${goal - album.registered} especies`,
    collector,
    stickers: ready ? entries.map(toSticker) : null,
    progress: ready ? undefined : `${album.registered}/${goal}`,
  };
}

export type HabitatOrder = 'number' | 'mine' | 'random';

/** Las celdas del póster de un hábitat, en el orden elegido; las fotos propias, si se usan. */
export function habitatPosterCells(section: HabitatSection, order: HabitatOrder, seed: number, photos: Record<string, string> = {}): HabitatPosterCell[] {
  let entries = [...section.entries];
  if (order === 'mine') entries.sort((a, b) => Number(!!b.sticker) - Number(!!a.sticker) || (a.species.albumNumber ?? 0) - (b.species.albumNumber ?? 0));
  if (order === 'random') {
    const ids = pickPosterSpecies(entries.map((e) => e.species.id), seed, entries.length);
    entries = ids.map((id) => entries.find((e) => e.species.id === id)!);
  }
  return entries.map((e) => ({
    figure: e.species.figure,
    number: formatAlbumNumber(e.species.albumNumber),
    name: e.species.commonName,
    done: !!e.sticker,
    tint: stickerTint(e.species.habitat),
    ring: e.sticker?.chrome ? (e.category === 'silver' ? 'silver' : 'holo') : null,
    photoUri: photos[e.species.id] ?? null,
  }));
}

/**
 * Exportar un póster en alta (3508 px de ancho): solo mientras se exporta se monta, fuera de la
 * pantalla, una copia del póster a ese tamaño; se espera a que se dibuje y se captura.
 */
export function usePosterExport(content: ReactNode) {
  const [armed, setArmed] = useState(false);
  const target = useRef<ComponentRef<typeof View>>(null);
  const drawn = useRef<(() => void) | null>(null);
  const width = POSTER_EXPORT_WIDTH / PixelRatio.get();

  const element = armed ? (
    <View pointerEvents="none" style={{ position: 'absolute', left: -width - 1000, top: 0 }}>
      <View
        ref={target}
        collapsable={false}
        // Un momento después de medirse, para que los SVG terminen de dibujarse.
        onLayout={() => setTimeout(() => drawn.current?.(), 300)}>
        <PosterFrame width={width}>{content}</PosterFrame>
      </View>
    </View>
  ) : null;

  async function run<T>(task: (view: CaptureTarget) => Promise<T>): Promise<T> {
    const ready = new Promise<void>((resolve) => {
      drawn.current = resolve;
    });
    setArmed(true);
    await ready;
    try {
      return await task(target as CaptureTarget);
    } finally {
      setArmed(false);
    }
  }

  return { element, run };
}
