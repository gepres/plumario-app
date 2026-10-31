import {
  conservationStatus,
  formatAlbumNumber,
  formatMass,
  formatWing,
  speciesSeals,
  type AlbumEntry,
} from '@plumario/core';
import { BirdCard, BirdCardBack, type StickerFinish } from '@plumario/ui';

import { CARD_RELIEF, FINISH_FRAMES, HABITAT_FRAMES, HABITAT_SCENES, SEAL_ART } from '@/constants/card-art';
import { FAMILY_FACTS, SPECIES_MEASURES } from '@/constants/card-facts';
import {
  CATEGORY_LABELS,
  CHROME_SOURCE_SHORT,
  CONSERVATION_LABELS,
  SEAL_LABELS,
  SEAL_MEANINGS,
  formatShortDate,
} from '@/constants/cards';
import { HABITAT_LABELS } from '@/constants/habitats';
import { STICKER_ART } from '@/constants/sticker-art';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** El acabado que muestra la carta de una entrada del álbum. */
export const entryFinish = ({ sticker, category }: AlbumEntry): StickerFinish => (sticker?.chrome ? category : 'normal');

const frameOf = (entry: AlbumEntry, finish: StickerFinish) =>
  finish === 'normal' ? HABITAT_FRAMES[entry.species.habitat ?? 'coast'] : FINISH_FRAMES[finish];

function statusLabel(entry: AlbumEntry) {
  const status = conservationStatus(entry.species);
  if (!status) return 'Sin datos';
  const label = CONSERVATION_LABELS[status.category] ?? status.category;
  return status.scope === 'peru' ? `${label} (Perú)` : label;
}

type Props = {
  entry: AlbumEntry;
  /** Las aves del álbum, para el pie de la carta. */
  total: number;
  size: number;
  /** Otro acabado que el suyo: el de la guía de diseño. */
  finish?: StickerFinish;
  still?: boolean;
};

/** La cara de la carta de una especie, con los datos que van dentro del paquete. */
export function SpeciesCard({ entry, total, size, finish = entryFinish(entry), still }: Props) {
  const { species, sticker } = entry;
  const habitat = species.habitat ?? 'coast';
  const family = FAMILY_FACTS[species.family ?? ''];
  const measures = SPECIES_MEASURES[species.id];
  const number = formatAlbumNumber(species.albumNumber);
  const ribbon = [family?.label, measures && formatMass(measures.massG), measures && formatWing(measures.wingMm)].filter(Boolean).join(' · ');
  return (
    <BirdCard
      finish={finish}
      habitat={habitat}
      habitatLabel={HABITAT_LABELS[habitat]}
      name={species.commonName}
      scientificName={species.scientificName}
      observations={sticker?.validPhotos ?? 0}
      ribbon={ribbon}
      traits={family?.traits ?? []}
      facts={[
        { label: 'Dieta', value: family?.diet ?? 'Sin datos' },
        { label: 'Hábitat', value: HABITAT_LABELS[habitat] },
        { label: 'Estado', value: statusLabel(entry) },
      ]}
      seals={speciesSeals(species).map((seal) => ({ image: SEAL_ART[seal], label: SEAL_LABELS[seal] }))}
      collection={`${capitalize(species.regionId)} ${number}/${total}`}
      finishLabel={finish === 'normal' ? '' : capitalize(CATEGORY_LABELS[finish])}
      figure={species.figure}
      art={STICKER_ART[species.id]}
      frame={frameOf(entry, finish)}
      scene={HABITAT_SCENES[habitat]}
      relief={CARD_RELIEF}
      size={size}
      still={still}
    />
  );
}

/** El reverso: lo que el dueño de la carta ha vivido con esa especie. */
export function SpeciesCardBack({ entry, size, finish = entryFinish(entry) }: Pick<Props, 'entry' | 'size' | 'finish'>) {
  const { species, sticker } = entry;
  return (
    <BirdCardBack
      eyebrow={`Tu registro · N.º ${formatAlbumNumber(species.albumNumber)}`}
      name={species.commonName}
      rows={[
        { label: 'Primera vez', value: sticker ? formatShortDate(sticker.completedAt) : '—' },
        { label: 'Fotos', value: String(sticker?.validPhotos ?? 0) },
        { label: 'Esta carta', value: sticker?.chrome ? CHROME_SOURCE_SHORT[sticker.chrome.source] : 'Primera foto' },
        { label: 'Hábitat', value: HABITAT_LABELS[species.habitat ?? 'coast'] },
        { label: 'Familia', value: FAMILY_FACTS[species.family ?? '']?.label ?? 'Sin datos' },
        { label: 'Estado', value: statusLabel(entry) },
      ]}
      seals={speciesSeals(species).map((seal) => ({ image: SEAL_ART[seal], label: SEAL_LABELS[seal], meaning: SEAL_MEANINGS[seal] }))}
      place={species.threatened ? 'Lugar oculto para proteger a esta ave.' : 'Tus lugares están en tu galería.'}
      frame={frameOf(entry, finish)}
      size={size}
    />
  );
}
