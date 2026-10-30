import { formatAlbumNumber, type AlbumEntry } from '@plumario/core';
import { BirdSticker } from '@plumario/ui';

import { stickerTint } from '@/constants/habitats';
import { STICKER_ART } from '@/constants/sticker-art';

/**
 * El sticker de una entrada del álbum: en sombra, normal o cromado con el acabado de su categoría.
 * Con `chromed` se dibuja su cromo aunque no se tenga (el que se pide en un intercambio).
 */
export function SpeciesSticker({ entry, size, chromed }: { entry: AlbumEntry; size: number; chromed?: boolean }) {
  const { species, sticker, category } = entry;
  return (
    <BirdSticker
      figure={species.figure}
      name={species.commonName}
      number={formatAlbumNumber(species.albumNumber)}
      tint={stickerTint(species.habitat)}
      finish={(chromed ?? !!sticker?.chrome) ? category : 'normal'}
      empty={!sticker && !chromed}
      size={size}
      art={STICKER_ART[species.id]}
    />
  );
}

/** Lo que lee un lector de pantalla al pasar por un sticker. */
export function stickerLabel({ species, sticker }: AlbumEntry): string {
  if (!sticker) return `${species.commonName}, sticker vacío: completar con una foto`;
  return `${species.commonName}${sticker.chrome ? ', cromado' : ''}, ver galería`;
}
