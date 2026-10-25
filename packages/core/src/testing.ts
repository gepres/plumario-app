// Constructores para las pruebas del núcleo (no se exportan desde index.ts).
import type { Habitat } from './domain/habitat';
import type { Species, TaxonClass } from './domain/species';
import type { Sticker } from './domain/sticker';

export const at = (day: number) => new Date(2026, 9, day);

export function species(id: string, overrides: Partial<Species> & { habitat?: Habitat | null; taxonClass?: TaxonClass } = {}): Species {
  return {
    id, regionId: 'ica', taxonClass: 'bird', albumNumber: 1, commonName: id, scientificName: id,
    habitat: 'coast', iucn: 'LC', threatened: false, endemic: false, emblematic: false,
    ...overrides,
  };
}

export function sticker(speciesId: string, overrides: Partial<Sticker> = {}): Sticker {
  return { speciesId, completedAt: at(1), validPhotos: 1, chrome: null, ...overrides };
}
