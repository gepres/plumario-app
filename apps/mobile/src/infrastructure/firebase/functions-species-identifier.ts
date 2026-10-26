import { httpsCallable } from '@react-native-firebase/functions';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { IdentifierError, type SpeciesIdentifier, type SpeciesSuggestion } from '@plumario/core';

import { firebaseErrorCode, type FirebaseServices } from './firebase-services';

// Adaptador del puerto SpeciesIdentifier con Gemini, que corre en las Functions suggestSpecies y
// checkPhoto (functions/src/ai.ts): la clave nunca está en la app. La foto viaja en base64, con el
// lado mayor en 1024 px: alcanza para reconocer el ave y pesa poco con mala señal.

/** Lado mayor de la foto que mira la IA. */
const AI_SIDE = 1024;
/** Gemini tarda unos segundos; con el modelo de reserva y un reintento en el servidor, hasta unos 47. */
const TIMEOUT_MS = 50_000;

type SuggestResponse = { birdVisible: boolean; suggestions: SpeciesSuggestion[] };
type CheckResponse = { valid: boolean; reason?: string };

async function encode(uri: string): Promise<string> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const context = ImageManipulator.manipulate(original);
  if (Math.max(original.width, original.height) > AI_SIDE) context.resize(original.width >= original.height ? { width: AI_SIDE } : { height: AI_SIDE });
  const saved = await (await context.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
  if (!saved.base64) throw new IdentifierError('unavailable');
  return saved.base64;
}

/** Los errores de la Function, en los del puerto: el tope del día, o cualquier otra falla. */
function toIdentifierError(error: unknown): IdentifierError {
  if (error instanceof IdentifierError) return error;
  return new IdentifierError(firebaseErrorCode(error).replace(/^functions\//, '') === 'resource-exhausted' ? 'quota' : 'unavailable');
}

export function createFunctionsSpeciesIdentifier({ functions }: FirebaseServices): SpeciesIdentifier {
  const suggestSpecies = httpsCallable<{ regionId: string; photo: string; limit: number }, SuggestResponse>(functions, 'suggestSpecies', { timeout: TIMEOUT_MS });
  const checkPhoto = httpsCallable<{ regionId: string; speciesId: string; photo: string }, CheckResponse>(functions, 'checkPhoto', { timeout: TIMEOUT_MS });

  // Sugerir y revisar miran la misma foto, una tras otra: se achica una sola vez.
  let last: { uri: string; photo: Promise<string> } | null = null;
  const photoFor = (uri: string) => {
    if (last?.uri !== uri) {
      const photo = encode(uri);
      last = { uri, photo };
      photo.catch(() => {
        if (last?.photo === photo) last = null;
      });
    }
    return last.photo;
  };

  return {
    async suggest(photoUri, candidates, limit) {
      const regionId = candidates[0]?.regionId;
      if (!regionId) return [];
      try {
        const { data } = await suggestSpecies({ regionId, photo: await photoFor(photoUri), limit });
        return data.suggestions;
      } catch (error) {
        throw toIdentifierError(error);
      }
    },

    async validate(photoUri, species) {
      try {
        const { data } = await checkPhoto({ regionId: species.regionId, speciesId: species.id, photo: await photoFor(photoUri) });
        return data;
      } catch (error) {
        throw toIdentifierError(error);
      }
    },
  };
}
