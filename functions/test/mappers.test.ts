import { Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';

import { stickerDocument, toSpecies, toSticker } from '../src/mappers.js';

describe('documentos de Firestore', () => {
  it('lee una especie del catálogo con su figura', () => {
    const species = toSpecies('larosterna-inca', {
      regionId: 'ica', taxonClass: 'bird', albumNumber: 56, commonName: 'Gaviotín Zarcillo', scientificName: 'Larosterna inca',
      habitat: 'coast', iucn: 'NT', threatened: false, endemic: false, emblematic: false, family: 'Laridae', genus: 'Larosterna',
    });
    expect(species).toMatchObject({ id: 'larosterna-inca', albumNumber: 56, habitat: 'coast', figure: 'tern' });
  });

  it('ida y vuelta de un sticker cromado', () => {
    const at = new Date(2026, 9, 24);
    const doc = stickerDocument({ speciesId: 'x', completedAt: at, validPhotos: 5, chrome: { source: 'photos', at } }, 'silver');
    expect(doc.chrome?.at).toBeInstanceOf(Timestamp);
    expect(toSticker('x', doc)).toEqual({ speciesId: 'x', completedAt: at, validPhotos: 5, chrome: { source: 'photos', at } });
  });
});
