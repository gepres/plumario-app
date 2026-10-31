import { collection, getDocs } from '@react-native-firebase/firestore';

import { HABITATS, figureOf, type Habitat, type Species, type SpeciesCatalog, type TaxonClass } from '@plumario/core';

import type { FirebaseServices } from './firebase-services';

// Adaptador de Firestore del puerto SpeciesCatalog. Lee regions/{regionId}/species, que escribe
// tools/species/seed.mjs desde data/species/ica.json. La caché sin conexión de Firestore deja el
// catálogo disponible aunque no haya señal.

const TAXON_CLASSES: readonly TaxonClass[] = ['bird', 'mammal', 'reptile'];

function toSpecies(id: string, data: Record<string, unknown>): Species {
  const taxonClass = TAXON_CLASSES.find((c) => c === data.taxonClass);
  if (!taxonClass) throw new Error(`Especie ${id}: clase desconocida «${String(data.taxonClass)}»`);
  const habitat = HABITATS.find((h) => h === data.habitat) ?? null;
  const scientificName = String(data.scientificName ?? id);
  return {
    id,
    regionId: String(data.regionId),
    taxonClass,
    albumNumber: typeof data.albumNumber === 'number' ? data.albumNumber : null,
    // Una especie del Excel no tiene nombre común: se muestra la científica.
    commonName: typeof data.commonName === 'string' && data.commonName ? data.commonName : scientificName,
    scientificName,
    habitat: habitat as Habitat | null,
    family: typeof data.family === 'string' ? data.family : null,
    iucn: typeof data.iucn === 'string' ? data.iucn : null,
    nationalCategory: typeof data.nationalCategory === 'string' ? data.nationalCategory : null,
    threatened: data.threatened === true,
    endemic: data.endemic === true,
    emblematic: data.emblematic === true,
    figure: figureOf({ family: typeof data.family === 'string' ? data.family : null, genus: typeof data.genus === 'string' ? data.genus : null }),
  };
}

export function createFirestoreSpeciesCatalog({ db }: FirebaseServices): SpeciesCatalog {
  return {
    async listByRegion(regionId) {
      const snapshot = await getDocs(collection(db, 'regions', regionId, 'species'));
      return snapshot.docs.map((doc) => toSpecies(doc.id, doc.data()));
    },
  };
}
