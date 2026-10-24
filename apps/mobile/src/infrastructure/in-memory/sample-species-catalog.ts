import type { Species, SpeciesCatalog } from '@plumario/core';

// Muestra con las especies que aparecen en el diseño, para la vista web y cuando no hay Firebase
// (EXPO_PUBLIC_DATA_SOURCE=memory). El catálogo real (data/species/ica.json) vive en Firestore.
const SAMPLE_SPECIES: readonly Species[] = [
  { id: 'zarapito-trinador', regionId: 'ica', taxonClass: 'bird', albumNumber: 6, commonName: 'Zarapito Trinador', scientificName: 'Numenius phaeopus', habitat: 'coast', threatened: false, endemic: false },
  { id: 'playero-arenero', regionId: 'ica', taxonClass: 'bird', albumNumber: 11, commonName: 'Playero Arenero', scientificName: 'Calidris alba', habitat: 'coast', threatened: false, endemic: false },
  { id: 'gaviota-peruana', regionId: 'ica', taxonClass: 'bird', albumNumber: 22, commonName: 'Gaviota Peruana', scientificName: 'Larus belcheri', habitat: 'coast', threatened: false, endemic: false },
  { id: 'gaviota-dominicana', regionId: 'ica', taxonClass: 'bird', albumNumber: 23, commonName: 'Gaviota Dominicana', scientificName: 'Larus dominicanus', habitat: 'coast', threatened: false, endemic: false },
  { id: 'gaviotin-peruano', regionId: 'ica', taxonClass: 'bird', albumNumber: 24, commonName: 'Gaviotín Peruano', scientificName: 'Sternula lorata', habitat: 'coast', threatened: true, endemic: false },
  { id: 'gaviotin-zarcillo', regionId: 'ica', taxonClass: 'bird', albumNumber: 25, commonName: 'Gaviotín Zarcillo', scientificName: 'Larosterna inca', habitat: 'coast', threatened: false, endemic: false },
  { id: 'cormoran-guanay', regionId: 'ica', taxonClass: 'bird', albumNumber: 37, commonName: 'Cormorán Guanay', scientificName: 'Leucocarbo bougainvilliorum', habitat: 'openSea', threatened: false, endemic: false },
  { id: 'churrete-marisquero', regionId: 'ica', taxonClass: 'bird', albumNumber: 42, commonName: 'Churrete Marisquero', scientificName: 'Cinclodes taczanowskii', habitat: 'coast', threatened: false, endemic: false },
  { id: 'flamenco-chileno', regionId: 'ica', taxonClass: 'bird', albumNumber: 50, commonName: 'Flamenco Chileno', scientificName: 'Phoenicopterus chilensis', habitat: 'wetlands', threatened: false, endemic: false },
  { id: 'ciguenuela-cuello-negro', regionId: 'ica', taxonClass: 'bird', albumNumber: 61, commonName: 'Cigüeñuela de Cuello Negro', scientificName: 'Himantopus mexicanus', habitat: 'wetlands', threatened: false, endemic: false },
  { id: 'condor-andino', regionId: 'ica', taxonClass: 'bird', albumNumber: 184, commonName: 'Cóndor Andino', scientificName: 'Vultur gryphus', habitat: 'highlands', threatened: true, endemic: false },
];

/** Adaptador en memoria del puerto SpeciesCatalog. */
export const sampleSpeciesCatalog: SpeciesCatalog = {
  listByRegion: async (regionId) => SAMPLE_SPECIES.filter((species) => species.regionId === regionId),
};
