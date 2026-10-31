import { formatAlbumNumber, speciesSeals, type AlbumEntry } from '@plumario/core';
import { BirdSticker } from '@plumario/ui';

import { SEAL_ART } from '@/constants/card-art';
import { stickerTint } from '@/constants/habitats';
import { STICKER_ART } from '@/constants/sticker-art';

/**
 * El sticker de una entrada del álbum: en sombra, normal o con su mejor acabado.
 * Con `chromed` se dibuja su cromo aunque no se tenga (el que se pide en un intercambio). Con
 * `decorated` lleva sus sellos y el destello del acabado: es la miniatura de la carta en el álbum.
 */
export function SpeciesSticker({ entry, size, chromed, decorated }: { entry: AlbumEntry; size: number; chromed?: boolean; decorated?: boolean }) {
  const { species, sticker, finish } = entry;
  return (
    <BirdSticker
      figure={species.figure}
      name={species.commonName}
      number={formatAlbumNumber(species.albumNumber)}
      tint={stickerTint(species.habitat)}
      finish={finish ?? (chromed ? 'holographic' : 'normal')}
      empty={!sticker && !chromed}
      size={size}
      art={STICKER_ART[species.id]}
      seals={decorated ? speciesSeals(species).map((seal) => SEAL_ART[seal]) : undefined}
      shine={decorated}
    />
  );
}

/** Lo que lee un lector de pantalla al pasar por un sticker. */
export function stickerLabel({ species, sticker }: AlbumEntry): string {
  if (!sticker) return `${species.commonName}, sticker vacío: completar con una foto`;
  return `${species.commonName}${sticker.best ? ', cromado' : ''}, ver galería`;
}
