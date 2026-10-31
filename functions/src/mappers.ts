import { Timestamp } from 'firebase-admin/firestore';

import { HABITATS, figureOf, type ChromeSource, type Species, type Sticker, type TaxonClass } from '@plumario/core';

// Documentos de Firestore → tipos del núcleo, del lado del servidor (Admin SDK). Los mismos campos
// que lee la app (apps/mobile/src/infrastructure/firebase).

const TAXON_CLASSES: readonly TaxonClass[] = ['bird', 'mammal', 'reptile'];
const CHROME_SOURCES: readonly ChromeSource[] = ['luck', 'photos', 'trade'];

const toDate = (value: unknown) => (value instanceof Timestamp ? value.toDate() : new Date(0));
const text = (value: unknown) => (typeof value === 'string' ? value : null);

export function toSpecies(id: string, data: Record<string, unknown>): Species {
  const scientificName = text(data.scientificName) ?? id;
  return {
    id,
    regionId: String(data.regionId),
    taxonClass: TAXON_CLASSES.find((c) => c === data.taxonClass) ?? 'bird',
    albumNumber: typeof data.albumNumber === 'number' ? data.albumNumber : null,
    commonName: text(data.commonName) || scientificName,
    scientificName,
    habitat: HABITATS.find((h) => h === data.habitat) ?? null,
    family: text(data.family),
    iucn: text(data.iucn),
    nationalCategory: text(data.nationalCategory),
    threatened: data.threatened === true,
    endemic: data.endemic === true,
    emblematic: data.emblematic === true,
    figure: figureOf({ family: text(data.family), genus: text(data.genus) }),
  };
}

export function toSticker(speciesId: string, data: Record<string, unknown>): Sticker {
  const chrome = data.chrome as { source?: unknown; at?: unknown } | null | undefined;
  const source = CHROME_SOURCES.find((s) => s === chrome?.source);
  return {
    speciesId,
    completedAt: toDate(data.completedAt),
    validPhotos: typeof data.validPhotos === 'number' ? data.validPhotos : 1,
    chrome: source ? { source, at: toDate(chrome?.at) } : null,
  };
}

/** Un sticker como documento de users/{uid}/stickers/{speciesId}. */
export function stickerDocument(sticker: Sticker, category: string) {
  return {
    completedAt: Timestamp.fromDate(sticker.completedAt),
    validPhotos: sticker.validPhotos,
    chrome: sticker.chrome ? { source: sticker.chrome.source, at: Timestamp.fromDate(sticker.chrome.at) } : null,
    category,
  };
}
