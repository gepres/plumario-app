import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';

import { ALBUM_CLASS, type Species } from '@plumario/core';

import { createGemini, type GeminiImage } from './gemini.js';
import { checkPhotoAgainst, suggestFromPhoto } from './identify.js';
import { toSpecies } from './mappers.js';

// La IA que mira la foto, para la app (RegistrarIdentificar y RegistrarColocar). Son funciones
// invocables: piden sesión, y cada persona tiene un tope de consultas por día, porque cada una cuesta
// (unos 6.000 tokens para sugerir, con la lista de especies; unos 1.300 para revisar). El tope se
// cuenta en users/{uid}/usage/{día}, que solo escribe el servidor.

export const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

/** Consultas a la IA por persona y por día (sugerir y revisar). Registrar 20 aves gasta 40. */
export const AI_DAILY_LIMIT = 60;
/** Revisiones de registros guardados por persona y por día; las hace el servidor y también cuestan. */
export const VALIDATION_DAILY_LIMIT = 60;
/** La foto llega en base64; la app la achica a 1024 px, así que pesa bastante menos. */
const MAX_PHOTO_BASE64 = 4_000_000;
const CATALOG_TTL_MS = 10 * 60_000;
const ID = /^[a-z0-9-]{1,80}$/;

const options = { secrets: [GEMINI_API_KEY], timeoutSeconds: 60, memory: '512MiB' as const };

// El catálogo del álbum de cada región, guardado unos minutos en la instancia: cambia muy poco y se
// lee en cada consulta.
const catalogs = new Map<string, { at: number; species: Species[] }>();

async function albumCatalog(regionId: string): Promise<Species[]> {
  const cached = catalogs.get(regionId);
  if (cached && Date.now() - cached.at < CATALOG_TTL_MS) return cached.species;
  const snapshot = await getFirestore().collection('regions').doc(regionId).collection('species').where('taxonClass', '==', ALBUM_CLASS).get();
  const species = snapshot.docs.map((doc) => toSpecies(doc.id, doc.data())).sort((a, b) => (a.albumNumber ?? 0) - (b.albumNumber ?? 0));
  catalogs.set(regionId, { at: Date.now(), species });
  return species;
}

function signedInUid(request: CallableRequest): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Inicia sesión para usar la IA.');
  return request.auth.uid;
}

function idFrom(value: unknown, field: string): string {
  if (typeof value !== 'string' || !ID.test(value)) throw new HttpsError('invalid-argument', `Falta ${field}.`);
  return value;
}

function photoFrom(value: unknown): GeminiImage {
  if (typeof value !== 'string' || value.length === 0) throw new HttpsError('invalid-argument', 'Falta la foto.');
  if (value.length > MAX_PHOTO_BASE64) throw new HttpsError('invalid-argument', 'La foto es demasiado grande.');
  return { mimeType: 'image/jpeg', data: value };
}

/** Suma uno al contador del día si no llegó al tope, y dice si lo sumó. */
async function spendDaily(uid: string, field: 'aiCalls' | 'validations', limit: number): Promise<boolean> {
  const db = getFirestore();
  const ref = db.collection('users').doc(uid).collection('usage').doc(new Date().toISOString().slice(0, 10));
  return db.runTransaction(async (tx) => {
    const used = Number((await tx.get(ref)).data()?.[field] ?? 0);
    if (used >= limit) return false;
    tx.set(ref, { [field]: used + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return true;
  });
}

/** Suma una consulta del día; si ya llegó al tope, no deja seguir. */
async function useQuota(uid: string) {
  if (!(await spendDaily(uid, 'aiCalls', AI_DAILY_LIMIT))) throw new HttpsError('resource-exhausted', 'Llegaste al máximo de consultas a la IA por hoy.');
}

/** Suma una revisión del día; false si ya llegó al tope y no se debe llamar a la IA. */
export const spendValidation = (uid: string) => spendDaily(uid, 'validations', VALIDATION_DAILY_LIMIT);

/** Lo que falle de Gemini llega a la app como «no disponible»: la persona puede elegir a mano. */
function unavailable(error: unknown, uid: string): never {
  if (error instanceof HttpsError) throw error;
  logger.error('La IA no respondió', { uid, error: String(error) });
  throw new HttpsError('unavailable', 'La IA no respondió. Vuelve a intentar o busca la especie en el álbum.');
}

/** RegistrarIdentificar: { regionId, photo (JPEG en base64), limit } → { birdVisible, suggestions }. */
export const suggestSpecies = onCall(options, async (request) => {
  const uid = signedInUid(request);
  const data = (request.data ?? {}) as Record<string, unknown>;
  const regionId = idFrom(data.regionId, 'la región');
  const image = photoFrom(data.photo);
  const limit = typeof data.limit === 'number' ? data.limit : 3;
  const candidates = await albumCatalog(regionId);
  if (candidates.length === 0) throw new HttpsError('not-found', 'La región no tiene especies.');
  await useQuota(uid);
  try {
    return await suggestFromPhoto(createGemini(GEMINI_API_KEY.value()), image, candidates, limit);
  } catch (error) {
    return unavailable(error, uid);
  }
});

/** RegistrarColocar: { regionId, speciesId, photo } → { valid, reason? }. */
export const checkPhoto = onCall(options, async (request) => {
  const uid = signedInUid(request);
  const data = (request.data ?? {}) as Record<string, unknown>;
  const regionId = idFrom(data.regionId, 'la región');
  const speciesId = idFrom(data.speciesId, 'la especie');
  const image = photoFrom(data.photo);
  const species = (await albumCatalog(regionId)).find((s) => s.id === speciesId);
  if (!species) throw new HttpsError('not-found', 'Esa especie no está en el álbum de la región.');
  await useQuota(uid);
  try {
    return await checkPhotoAgainst(createGemini(GEMINI_API_KEY.value()), image, species);
  } catch (error) {
    return unavailable(error, uid);
  }
});
