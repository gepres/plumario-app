import type { Species, SpeciesCatalog } from '@plumario/core';

// Muestra con las especies que aparecen en el diseño, para la vista web y cuando no hay Firebase
// (EXPO_PUBLIC_DATA_SOURCE=memory). El catálogo real (data/species/ica.json) vive en Firestore.
const SAMPLE_SPECIES: readonly Species[] = [
  { id: 'numenius-phaeopus', regionId: 'ica', taxonClass: 'bird', albumNumber: 6, commonName: 'Zarapito Trinador', scientificName: 'Numenius phaeopus', habitat: 'coast', family: 'Scolopacidae', iucn: 'LC', nationalCategory: null, threatened: false, endemic: false, emblematic: false, figure: 'shorebird' },
  { id: 'calidris-alba', regionId: 'ica', taxonClass: 'bird', albumNumber: 11, commonName: 'Playero Arenero', scientificName: 'Calidris alba', habitat: 'coast', family: 'Scolopacidae', iucn: 'LC', nationalCategory: null, threatened: false, endemic: false, emblematic: false, figure: 'shorebird' },
  { id: 'larus-belcheri', regionId: 'ica', taxonClass: 'bird', albumNumber: 22, commonName: 'Gaviota Peruana', scientificName: 'Larus belcheri', habitat: 'coast', family: 'Laridae', iucn: 'LC', nationalCategory: null, threatened: false, endemic: false, emblematic: false, figure: 'gull' },
  { id: 'larus-dominicanus', regionId: 'ica', taxonClass: 'bird', albumNumber: 23, commonName: 'Gaviota Dominicana', scientificName: 'Larus dominicanus', habitat: 'coast', family: 'Laridae', iucn: 'LC', nationalCategory: null, threatened: false, endemic: false, emblematic: false, figure: 'gull' },
  { id: 'sternula-lorata', regionId: 'ica', taxonClass: 'bird', albumNumber: 24, commonName: 'Gaviotín Peruano', scientificName: 'Sternula lorata', habitat: 'coast', family: 'Laridae', iucn: 'VU', nationalCategory: null, threatened: true, endemic: false, emblematic: false, figure: 'tern' },
  { id: 'larosterna-inca', regionId: 'ica', taxonClass: 'bird', albumNumber: 25, commonName: 'Gaviotín Zarcillo', scientificName: 'Larosterna inca', habitat: 'coast', family: 'Laridae', iucn: 'LC', nationalCategory: null, threatened: false, endemic: false, emblematic: false, figure: 'tern' },
  { id: 'phalacrocorax-bougainvillii', regionId: 'ica', taxonClass: 'bird', albumNumber: 37, commonName: 'Cormorán Guanay', scientificName: 'Leucocarbo bougainvilliorum', habitat: 'openSea', family: 'Phalacrocoracidae', iucn: 'LC', nationalCategory: null, threatened: false, endemic: false, emblematic: false, figure: 'cormorant' },
  { id: 'cinclodes-taczanowskii', regionId: 'ica', taxonClass: 'bird', albumNumber: 42, commonName: 'Churrete Marisquero', scientificName: 'Cinclodes taczanowskii', habitat: 'coast', family: 'Furnariidae', iucn: 'LC', nationalCategory: null, threatened: false, endemic: true, emblematic: false, figure: 'songbird' },
  { id: 'phoenicopterus-chilensis', regionId: 'ica', taxonClass: 'bird', albumNumber: 50, commonName: 'Flamenco Chileno', scientificName: 'Phoenicopterus chilensis', habitat: 'wetlands', family: 'Phoenicopteridae', iucn: 'NT', nationalCategory: null, threatened: false, endemic: false, emblematic: true, figure: 'flamingo' },
  { id: 'himantopus-mexicanus', regionId: 'ica', taxonClass: 'bird', albumNumber: 61, commonName: 'Cigüeñuela de Cuello Negro', scientificName: 'Himantopus mexicanus', habitat: 'wetlands', family: 'Recurvirostridae', iucn: 'LC', nationalCategory: null, threatened: false, endemic: false, emblematic: false, figure: 'stilt' },
  { id: 'vultur-gryphus', regionId: 'ica', taxonClass: 'bird', albumNumber: 184, commonName: 'Cóndor Andino', scientificName: 'Vultur gryphus', habitat: 'highlands', family: 'Cathartidae', iucn: 'VU', nationalCategory: null, threatened: true, endemic: false, emblematic: false, figure: 'vulture' },
];

/** Adaptador en memoria del puerto SpeciesCatalog. */
export const sampleSpeciesCatalog: SpeciesCatalog = {
  listByRegion: async (regionId) => SAMPLE_SPECIES.filter((species) => species.regionId === regionId),
};
