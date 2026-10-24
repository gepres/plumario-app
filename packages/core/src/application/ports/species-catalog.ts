import type { RegionId, Species } from '../../domain/species';

/** Puerto de salida: el catálogo de especies de cada región. */
export interface SpeciesCatalog {
  listByRegion(regionId: RegionId): Promise<readonly Species[]>;
}
