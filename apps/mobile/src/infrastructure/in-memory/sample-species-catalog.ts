import type { Species, SpeciesCatalog } from '@plumario/core';

// Muestra con las especies que aparecen en el diseño, mientras se decide la fuente del catálogo
// real de Ica (289 especies; tarjeta PA-12). No es el catálogo: solo da algo que mostrar.
const SAMPLE_SPECIES: readonly Species[] = [
  { id: 'zarapito-trinador', regionId: 'ica', number: 6, commonName: 'Zarapito Trinador', scientificName: 'Numenius phaeopus', habitat: 'coast', threatened: false },
  { id: 'playero-arenero', regionId: 'ica', number: 11, commonName: 'Playero Arenero', scientificName: 'Calidris alba', habitat: 'coast', threatened: false },
  { id: 'gaviota-peruana', regionId: 'ica', number: 22, commonName: 'Gaviota Peruana', scientificName: 'Larus belcheri', habitat: 'coast', threatened: false },
  { id: 'gaviota-dominicana', regionId: 'ica', number: 23, commonName: 'Gaviota Dominicana', scientificName: 'Larus dominicanus', habitat: 'coast', threatened: false },
  { id: 'gaviotin-peruano', regionId: 'ica', number: 24, commonName: 'Gaviotín Peruano', scientificName: 'Sternula lorata', habitat: 'coast', threatened: true },
  { id: 'gaviotin-zarcillo', regionId: 'ica', number: 25, commonName: 'Gaviotín Zarcillo', scientificName: 'Larosterna inca', habitat: 'coast', threatened: false },
  { id: 'cormoran-guanay', regionId: 'ica', number: 37, commonName: 'Cormorán Guanay', scientificName: 'Leucocarbo bougainvilliorum', habitat: 'openSea', threatened: false },
  { id: 'churrete-marisquero', regionId: 'ica', number: 42, commonName: 'Churrete Marisquero', scientificName: 'Cinclodes taczanowskii', habitat: 'coast', threatened: false },
  { id: 'flamenco-chileno', regionId: 'ica', number: 50, commonName: 'Flamenco Chileno', scientificName: 'Phoenicopterus chilensis', habitat: 'wetlands', threatened: false },
  { id: 'ciguenuela-cuello-negro', regionId: 'ica', number: 61, commonName: 'Cigüeñuela de Cuello Negro', scientificName: 'Himantopus mexicanus', habitat: 'wetlands', threatened: false },
  { id: 'condor-andino', regionId: 'ica', number: 184, commonName: 'Cóndor Andino', scientificName: 'Vultur gryphus', habitat: 'highlands', threatened: true },
];

/** Adaptador en memoria del puerto SpeciesCatalog. */
export const sampleSpeciesCatalog: SpeciesCatalog = {
  listByRegion: async (regionId) => SAMPLE_SPECIES.filter((species) => species.regionId === regionId),
};
