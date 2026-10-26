import type { Species } from '@plumario/core';

import type { AskGemini, GeminiImage } from './gemini.js';

// Lo que se le pregunta a Gemini sobre una foto y cómo se lee su respuesta: sugerir especies entre
// las del álbum de la región (RegistrarIdentificar) y revisar que la foto sea de la especie elegida
// (RegistrarColocar, y otra vez en el servidor al guardar el registro).

const SYSTEM =
  'Eres ornitólogo y conoces las aves de Ica, en el Perú. Miras fotos que toma la gente al salir a ' +
  'observar aves (a veces de lejos, movidas o con el ave pequeña) y reconoces la especie.';

/** Cuántas sugerencias como máximo; el diseño muestra 3. */
export const MAX_SUGGESTIONS = 5;

export type SuggestResult = { birdVisible: boolean; suggestions: { speciesId: string; confidence: number }[] };
export type CheckResult = { valid: boolean; reason?: string };

type SuggestAnswer = { birdVisible?: boolean; candidates?: { n?: number; confidence?: number }[] };
type CheckAnswer = { birdVisible?: boolean; matches?: boolean; reason?: string };

const clamp = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

/**
 * Las especies que pueden ser el ave de la foto, de la más a la menos probable. Las candidatas van
 * numeradas y Gemini responde con números: la respuesta es corta y no puede inventar una especie
 * que no esté en el álbum.
 */
export async function suggestFromPhoto(ask: AskGemini, image: GeminiImage, candidates: readonly Species[], limit: number): Promise<SuggestResult> {
  const max = Math.min(Math.max(1, Math.floor(limit)), MAX_SUGGESTIONS);
  const list = candidates.map((s, i) => `${i + 1}|${s.commonName}|${s.scientificName}`).join('\n');
  const answer = await ask<SuggestAnswer>({
    system: SYSTEM,
    image,
    prompt:
      `Especies posibles (número|nombre común|nombre científico):\n${list}\n\n` +
      `¿Qué especie de la lista es el ave de la foto? Da hasta ${max} números de la lista, de la más a la ` +
      'menos probable, cada una con tu confianza de 0 a 1. Si en la foto no se ve ningún ave, ' +
      'birdVisible = false y la lista vacía.',
    schema: {
      type: 'object',
      properties: {
        birdVisible: { type: 'boolean' },
        candidates: {
          type: 'array',
          maxItems: max,
          items: { type: 'object', properties: { n: { type: 'integer' }, confidence: { type: 'number' } }, required: ['n', 'confidence'] },
        },
      },
      required: ['birdVisible', 'candidates'],
    },
  });
  if (answer.birdVisible === false) return { birdVisible: false, suggestions: [] };

  const suggestions: SuggestResult['suggestions'] = [];
  for (const candidate of answer.candidates ?? []) {
    const species = typeof candidate.n === 'number' ? candidates[candidate.n - 1] : undefined;
    if (!species || suggestions.some((s) => s.speciesId === species.id)) continue;
    suggestions.push({ speciesId: species.id, confidence: clamp(candidate.confidence) });
    if (suggestions.length === max) break;
  }
  return { birdVisible: true, suggestions };
}

/**
 * ¿La foto es de esa especie? Ante la duda, sí: rechazar una foto buena frustra más que aceptar una
 * dudosa, y la persona ya eligió la especie mirando su foto.
 */
export async function checkPhotoAgainst(ask: AskGemini, image: GeminiImage, species: Species): Promise<CheckResult> {
  const answer = await ask<CheckAnswer>({
    system: SYSTEM,
    image,
    prompt:
      `La persona dice que el ave de la foto es ${species.commonName} (${species.scientificName}).\n` +
      '- birdVisible: ¿se ve al menos un ave en la foto?\n' +
      '- matches: true si el ave puede ser esa especie, también si es un juvenil o una hembra, o si se ve ' +
      'de lejos. false solo si estás bastante seguro de que es otra especie.\n' +
      '- reason: si matches es false, una frase corta en español, hablándole de tú, que diga qué ave ' +
      `parece; por ejemplo: «Parece un Playero Coleador, no ${species.commonName}». Si matches es true, déjalo vacío.`,
    schema: {
      type: 'object',
      properties: { birdVisible: { type: 'boolean' }, matches: { type: 'boolean' }, reason: { type: 'string' } },
      required: ['birdVisible', 'matches', 'reason'],
    },
  });
  if (answer.birdVisible === false) return { valid: false, reason: 'No vemos un ave en la foto. Prueba con otra donde se vea entera y nítida.' };
  if (answer.matches === false) return { valid: false, reason: answer.reason?.trim().slice(0, 160) || `La foto no parece de ${species.commonName}.` };
  return { valid: true };
}
