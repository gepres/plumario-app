import { getFirestore, Timestamp, type DocumentReference } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions/v2';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { achievementId, evaluateValidatedPhoto, sightingResultOf, type Achievement, type SightingResult, type Species } from '@plumario/core';

import { GEMINI_API_KEY, spendValidation } from './ai.js';
import { createGemini } from './gemini.js';
import { checkPhotoAgainst, type CheckResult } from './identify.js';
import { stickerDocument, toSpecies, toSticker } from './mappers.js';
import { achievementsNotice } from './notices.js';
import { notifyUser } from './notify.js';
import { DUPLICATE_PHOTO_REASON, photoClaimId } from './photo-claims.js';

// Cuando la app guarda un registro pendiente (users/{uid}/sightings/{id}), el servidor valida la
// foto y, si es de la especie elegida, otorga lo que corresponde en una transacción: completa el
// sticker o suma la foto, sortea el cromo y guarda los logros. El resultado queda en el registro y
// la app lo muestra (RegistrarCompletado, RevelarCromado). Las reglas no dejan que el cliente
// escriba nada de esto.

const MISSING_PHOTO_REASON = 'No encontramos tu foto.';
const DAILY_LIMIT_REASON = 'Llegaste al máximo de registros por hoy. Vuelve a intentarlo mañana.';

/** La foto del registro, de Storage; null si no es del usuario o no está. */
async function readPhoto(uid: string, photoPath: string): Promise<Buffer | null> {
  if (!photoPath.startsWith(`users/${uid}/photos/`)) return null;
  try {
    const [photo] = await getStorage().bucket().file(photoPath).download();
    return photo;
  } catch (error) {
    logger.warn('No se pudo leer la foto', { uid, photoPath, error: String(error) });
    return null;
  }
}

/**
 * La IA revisa la foto. Si no responde, se da por buena: la app ya la revisó antes de guardar y el
 * registro no debe quedar trabado por una falla de Gemini.
 */
async function validatePhoto(uid: string, photoPath: string, photo: Buffer, species: Species): Promise<CheckResult> {
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

  const photoPath = String(sighting.photoPath ?? '');
  const photo = await readPhoto(uid, photoPath);
  if (!photo) return reject(snapshot.ref, MISSING_PHOTO_REASON);

  // Lo que se puede descartar sin gastar IA va antes de llamarla.
  const user = db.collection('users').doc(uid);
  const claim = user.collection('photoClaims').doc(photoClaimId(photo));
  if ((await claim.get()).exists) return reject(snapshot.ref, DUPLICATE_PHOTO_REASON);
  if (!(await spendValidation(uid))) return reject(snapshot.ref, DAILY_LIMIT_REASON);

  const verdict = await validatePhoto(uid, photoPath, photo, species);
  if (!verdict.valid) return reject(snapshot.ref, verdict.reason ?? 'No se reconoce la especie en la foto.');

  let earned: Achievement[] = [];
  await db.runTransaction(async (tx) => {
    earned = [];
    // Primero todas las lecturas (lo pide la transacción); si el registro ya no está pendiente es
    // un reintento de la función y no se otorga dos veces.
    const [current, claimed, stickersSnapshot] = await Promise.all([tx.get(snapshot.ref), tx.get(claim), tx.get(user.collection('stickers'))]);
    if (current.data()?.status !== 'pending') return;
    const now = new Date();
    // Dos registros con la misma foto a la vez: gana el primero que llega aquí.
    if (claimed.exists) {
      const duplicate: SightingResult = { outcome: 'rejected', reason: DUPLICATE_PHOTO_REASON };
      tx.update(snapshot.ref, { status: 'rejected', result: duplicate, validatedAt: Timestamp.fromDate(now) });
      return;
    }
    const stickers = stickersSnapshot.docs.map((doc) => toSticker(doc.id, doc.data()));
    const result = evaluateValidatedPhoto({ species, catalog, stickers, at: now, roll: Math.random() });
    earned = [...result.achievements];

    tx.set(claim, { sightingId: snapshot.id, claimedAt: Timestamp.fromDate(now) });
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
