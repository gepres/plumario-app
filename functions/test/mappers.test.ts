import { newSticker } from '@plumario/core';
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
    const sticker = { ...newSticker('x', at), validPhotos: 5, observations: 3, lastCountedAt: at, best: 'holographic' as const, ownBest: 'holographic' as const, claimedMilestone: 3, unlocked: [{ finish: 'holographic' as const, source: 'milestone' as const, at }] };
    const doc = stickerDocument(sticker);
    expect(doc.unlocked[0]?.at).toBeInstanceOf(Timestamp);
    expect(toSticker('x', doc)).toEqual(sticker);
  });
});
