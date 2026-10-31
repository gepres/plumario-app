import { FieldValue, getFirestore, Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { evaluateRevalidatedPhoto, nextFinishMilestone, type SightingResult } from '@plumario/core';

import { GEMINI_API_KEY } from './ai.js';
import { stickerDocument, toSpecies, toSticker } from './mappers.js';
import { readPhoto, resultDocument, reviewPhoto } from './sightings.js';

// Si Gemini cae, la foto y el sticker entran y el registro queda con reviewPending. Esta tarea los
// vuelve a revisar: si la IA aprueba, la observación cuenta como si hubiera contado al subirla; si
// rechaza, la foto sale de la galería. Con la IA todavía caída, se queda para la siguiente vuelta.

/** Pocos por vuelta: cada uno es una llamada a Gemini. */
const BATCH = 20;
const UNRECOGNIZED = 'Al revisarla, no reconocimos la especie en la foto.';

async function revalidate(snapshot: QueryDocumentSnapshot) {
  const sighting = snapshot.data();
  const uid = snapshot.ref.parent.parent!.id;
  const db = getFirestore();
  const speciesDoc = await db.collection('regions').doc(String(sighting.regionId)).collection('species').doc(String(sighting.speciesId)).get();
  if (!speciesDoc.exists) return;
  const species = toSpecies(speciesDoc.id, speciesDoc.data()!);
  const photoPath = String(sighting.photoPath ?? '');
  const photo = await readPhoto(uid, photoPath);
  const verdict = photo && (await reviewPhoto(uid, photoPath, photo, species));
  // Sin foto se reintenta: puede ser una falla de Storage, y la decisión no se pierde.
  if (!verdict) return;

  const stickerRef = db.collection('users').doc(uid).collection('stickers').doc(species.id);
  await db.runTransaction(async (tx) => {
    const [current, stickerDoc] = await Promise.all([tx.get(snapshot.ref), tx.get(stickerRef)]);
    if (current.data()?.reviewPending !== true || !stickerDoc.exists) return;
    const sticker = toSticker(species.id, stickerDoc.data()!);
    const now = new Date();

    if (!verdict.valid) {
      const rejected: SightingResult = { outcome: 'rejected', reason: verdict.reason ?? UNRECOGNIZED };
      tx.update(stickerRef, { validPhotos: FieldValue.increment(-1) });
      tx.update(snapshot.ref, { status: 'rejected', result: rejected, reviewPending: false, validatedAt: Timestamp.fromDate(now) });
      return;
    }

    const takenAt = sighting.takenAt instanceof Timestamp ? sighting.takenAt.toDate() : now;
    const outcome = evaluateRevalidatedPhoto({ sticker, species, takenAt, at: now, roll: Math.random() });
    const previous = current.data()?.result as Extract<SightingResult, { outcome: 'validated' }>;
    tx.set(stickerRef, stickerDocument(outcome.sticker));
    tx.update(snapshot.ref, {
      reviewPending: false,
      result: resultDocument({
        ...previous,
        counted: outcome.counted,
        blocked: outcome.blocked,
        unlocked: outcome.unlocked,
        finish: outcome.sticker.best,
        observations: outcome.sticker.observations,
        next: nextFinishMilestone(outcome.sticker.observations),
      }),
    });
  });
}

/** Los registros que la IA no pudo revisar. Separada del horario para poder probarla. */
export async function revalidatePending() {
  const pending = await getFirestore().collectionGroup('sightings').where('reviewPending', '==', true).limit(BATCH).get();
  for (const snapshot of pending.docs) {
    try {
      await revalidate(snapshot);
    } catch (error) {
      logger.error('No se pudo revalidar un registro', { path: snapshot.ref.path, error: String(error) });
    }
  }
  return pending.size;
}

export const revalidateSightings = onSchedule({ schedule: 'every 30 minutes', secrets: [GEMINI_API_KEY], memory: '512MiB', timeoutSeconds: 300 }, async () => {
  const size = await revalidatePending();
  if (size > 0) logger.info('Registros revalidados', { size });
});
