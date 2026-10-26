import { getFirestore, Timestamp, type DocumentReference } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions/v2';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { achievementId, evaluateValidatedPhoto, sightingResultOf, type Achievement, type SightingResult, type Species } from '@plumario/core';

import { GEMINI_API_KEY } from './ai.js';
import { createGemini } from './gemini.js';
import { checkPhotoAgainst, type CheckResult } from './identify.js';
import { stickerDocument, toSpecies, toSticker } from './mappers.js';
import { achievementsNotice } from './notices.js';
import { notifyUser } from './notify.js';

// Cuando la app guarda un registro pendiente (users/{uid}/sightings/{id}), el servidor valida la
// foto y, si es de la especie elegida, otorga lo que corresponde en una transacción: completa el
// sticker o suma la foto, sortea el cromo y guarda los logros. El resultado queda en el registro y
// la app lo muestra (RegistrarCompletado, RevelarCromado). Las reglas no dejan que el cliente
// escriba nada de esto.

/**
 * La IA revisa la foto guardada en Storage. Si la foto no es del usuario o no está, se rechaza; si
 * la IA no responde, se da por buena: la app ya la revisó antes de guardar y el registro no debe
 * quedar trabado por una falla de Gemini.
 */
async function validatePhoto(uid: string, photoPath: string, species: Species): Promise<CheckResult> {
  if (!photoPath.startsWith(`users/${uid}/photos/`)) return { valid: false, reason: 'No encontramos tu foto.' };
  let photo: Buffer;
  try {
    [photo] = await getStorage().bucket().file(photoPath).download();
  } catch (error) {
    logger.warn('No se pudo leer la foto', { uid, photoPath, error: String(error) });
    return { valid: false, reason: 'No encontramos tu foto.' };
  }
  try {
    return await checkPhotoAgainst(createGemini(GEMINI_API_KEY.value()), { mimeType: 'image/jpeg', data: photo.toString('base64') }, species);
  } catch (error) {
    logger.error('La IA no respondió; el registro se da por bueno', { uid, photoPath, error: String(error) });
    return { valid: true };
  }
}

async function reject(ref: DocumentReference, reason: string) {
  const result: SightingResult = { outcome: 'rejected', reason };
  await ref.update({ status: 'rejected', result, validatedAt: Timestamp.now() });
}

export const onSightingCreated = onDocumentCreated({ document: 'users/{uid}/sightings/{sightingId}', secrets: [GEMINI_API_KEY], memory: '512MiB' }, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const sighting = snapshot.data();
  if (sighting?.status !== 'pending') return;
  const { uid } = event.params;
  const db = getFirestore();

  const catalogSnapshot = await db.collection('regions').doc(String(sighting.regionId)).collection('species').get();
  const catalog = catalogSnapshot.docs.map((doc) => toSpecies(doc.id, doc.data()));
  const species = catalog.find((s) => s.id === sighting.speciesId);
  if (!species) return reject(snapshot.ref, 'La especie no está en el catálogo de la región.');

  const verdict = await validatePhoto(uid, String(sighting.photoPath ?? ''), species);
  if (!verdict.valid) return reject(snapshot.ref, verdict.reason ?? 'No se reconoce la especie en la foto.');

  const user = db.collection('users').doc(uid);
  let earned: Achievement[] = [];
  await db.runTransaction(async (tx) => {
    earned = [];
    // Primero todas las lecturas (lo pide la transacción); si el registro ya no está pendiente es
    // un reintento de la función y no se otorga dos veces.
    const [current, stickersSnapshot] = await Promise.all([tx.get(snapshot.ref), tx.get(user.collection('stickers'))]);
    if (current.data()?.status !== 'pending') return;
    const stickers = stickersSnapshot.docs.map((doc) => toSticker(doc.id, doc.data()));
    const now = new Date();
    const result = evaluateValidatedPhoto({ species, catalog, stickers, at: now, roll: Math.random() });
    earned = [...result.achievements];

    tx.set(user.collection('stickers').doc(species.id), stickerDocument(result.sticker, result.category));
    for (const achievement of result.achievements) {
      tx.set(user.collection('achievements').doc(achievementId(achievement)), { ...achievement, earnedAt: Timestamp.fromDate(now), seen: false });
    }
    tx.update(snapshot.ref, { status: 'validated', result: sightingResultOf(result), validatedAt: Timestamp.fromDate(now) });
  });
  logger.info('Registro validado', { uid, sightingId: event.params.sightingId, speciesId: species.id });
  // Con la app abierta la medalla ya se celebra; el aviso sirve si se validó con la app cerrada
  // (un registro que se subió solo al volver la señal).
  const notice = achievementsNotice(earned);
  if (notice) await notifyUser(uid, notice);
});
