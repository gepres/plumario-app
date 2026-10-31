// Constructores para las pruebas del núcleo (no se exportan desde index.ts).
import type { Habitat } from './domain/habitat';
import type { Species, TaxonClass } from './domain/species';
import { newSticker, type Sticker } from './domain/sticker';

export const at = (day: number) => new Date(2026, 9, day);

export function species(id: string, overrides: Partial<Species> & { habitat?: Habitat | null; taxonClass?: TaxonClass } = {}): Species {
  return {
    id, regionId: 'ica', taxonClass: 'bird', albumNumber: 1, commonName: id, scientificName: id,
    habitat: 'coast', family: null, iucn: 'LC', nationalCategory: null, threatened: false, endemic: false, emblematic: false, figure: 'shorebird',
    ...overrides,
  };
}

export function sticker(speciesId: string, overrides: Partial<Sticker> = {}): Sticker {
  return { ...newSticker(speciesId, at(1)), validPhotos: 1, observations: 1, lastCountedAt: at(1), ...overrides };
}
