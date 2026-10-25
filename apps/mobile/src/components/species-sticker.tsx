import { formatAlbumNumber, type AlbumEntry } from '@plumario/core';
import { BirdSticker } from '@plumario/ui';

import { stickerTint } from '@/constants/habitats';

/** El sticker de una entrada del álbum: en sombra, normal o cromado con el acabado de su categoría. */
export function SpeciesSticker({ entry, size }: { entry: AlbumEntry; size: number }) {
  const { species, sticker, category } = entry;
  return (
    <BirdSticker
      figure={species.figure}
      name={species.commonName}
      number={formatAlbumNumber(species.albumNumber)}
      tint={stickerTint(species.habitat)}
      finish={sticker?.chrome ? category : 'normal'}
      empty={!sticker}
      size={size}
    />
  );
}

/** Lo que lee un lector de pantalla al pasar por un sticker. */
export function stickerLabel({ species, sticker }: AlbumEntry): string {
  if (!sticker) return `${species.commonName}, sticker vacío: completar con una foto`;
  return `${species.commonName}${sticker.chrome ? ', cromado' : ''}, ver galería`;
}
