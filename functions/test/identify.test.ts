import { describe, expect, it } from 'vitest';

import type { AskGemini, GeminiRequest } from '../src/gemini.js';
import { checkPhotoAgainst, suggestFromPhoto } from '../src/identify.js';
import { toSpecies } from '../src/mappers.js';

const image = { mimeType: 'image/jpeg', data: 'AAAA' };
const birds = [
  toSpecies('larosterna-inca', { commonName: 'Gaviotín Zarcillo', scientificName: 'Larosterna inca' }),
  toSpecies('pelecanus-thagus', { commonName: 'Pelícano Peruano', scientificName: 'Pelecanus thagus' }),
  toSpecies('actitis-macularius', { commonName: 'Playero Coleador', scientificName: 'Actitis macularius' }),
];

/** Un Gemini falso que responde siempre lo mismo y guarda lo que se le preguntó. */
function fakeGemini(answer: unknown) {
  const asked: GeminiRequest[] = [];
  const ask = (async (request: GeminiRequest) => {
    asked.push(request);
    return answer;
  }) as AskGemini;
  return { ask, asked };
}

describe('sugerir especies', () => {
  it('manda la lista numerada y traduce los números a especies', async () => {
    const { ask, asked } = fakeGemini({ birdVisible: true, candidates: [{ n: 2, confidence: 0.9 }, { n: 1, confidence: 0.2 }] });
    const result = await suggestFromPhoto(ask, image, birds, 3);
    expect(asked[0]?.prompt).toContain('2|Pelícano Peruano|Pelecanus thagus');
    expect(asked[0]?.image).toBe(image);
    expect(result).toEqual({
      birdVisible: true,
      suggestions: [
        { speciesId: 'pelecanus-thagus', confidence: 0.9 },
        { speciesId: 'larosterna-inca', confidence: 0.2 },
      ],
    });
  });

  it('descarta números fuera de la lista y repetidos, y respeta el límite', async () => {
    const { ask } = fakeGemini({ birdVisible: true, candidates: [{ n: 9, confidence: 0.9 }, { n: 3, confidence: 1.4 }, { n: 3, confidence: 0.5 }, { n: 1, confidence: 0.4 }, { n: 2, confidence: 0.1 }] });
    const result = await suggestFromPhoto(ask, image, birds, 2);
    expect(result.suggestions).toEqual([
      { speciesId: 'actitis-macularius', confidence: 1 },
      { speciesId: 'larosterna-inca', confidence: 0.4 },
    ]);
  });

  it('sin ave en la foto, no sugiere nada', async () => {
    const { ask } = fakeGemini({ birdVisible: false, candidates: [{ n: 1, confidence: 0.1 }] });
    await expect(suggestFromPhoto(ask, image, birds, 3)).resolves.toEqual({ birdVisible: false, suggestions: [] });
  });
});

describe('revisar la foto', () => {
  const tern = birds[0]!;

  it('acepta si la IA dice que puede ser la especie', async () => {
    const { ask, asked } = fakeGemini({ birdVisible: true, matches: true, reason: '' });
    await expect(checkPhotoAgainst(ask, image, tern)).resolves.toEqual({ valid: true });
    expect(asked[0]?.prompt).toContain('Gaviotín Zarcillo (Larosterna inca)');
  });

  it('rechaza con la razón de la IA si es otra especie', async () => {
    const { ask } = fakeGemini({ birdVisible: true, matches: false, reason: ' Parece un Playero Coleador, no un Gaviotín Zarcillo. ' });
    await expect(checkPhotoAgainst(ask, image, tern)).resolves.toEqual({ valid: false, reason: 'Parece un Playero Coleador, no un Gaviotín Zarcillo.' });
  });

  it('sin razón, usa una propia; sin ave, pide otra foto', async () => {
    await expect(checkPhotoAgainst(fakeGemini({ birdVisible: true, matches: false, reason: '' }).ask, image, tern)).resolves.toEqual({
      valid: false,
      reason: 'La foto no parece de Gaviotín Zarcillo.',
    });
    await expect(checkPhotoAgainst(fakeGemini({ birdVisible: false, matches: false, reason: '' }).ask, image, tern)).resolves.toMatchObject({ valid: false });
  });
});
