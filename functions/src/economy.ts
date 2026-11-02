import { getFirestore, type DocumentSnapshot, type Transaction } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';

import {
  CATEGORY_RANK,
  FINISH_PRICES,
  NO_PIECES,
  PIECE_FINISHES,
  applyPackPiece,
  applyPurchase,
  packSpecies,
  packFinish,
  purchaseProblem,
  recyclePiece as recycle,
  type CardCategory,
  type PieceFinish,
} from '@plumario/core';

import { openingDocument, piecesDocument, stickerDocument, toPieceCounts, toSticker, toWallet, walletDocument } from './mappers.js';

// Abrir sobres, reciclar repetidas y subir de acabado (SobreAbrir, MisRepetidas, CompraAcabado). Las tres
// cosas cambian lo que vale algo, así que las decide el servidor en una transacción y las reglas no
// dejan que el cliente escriba nada de esto. El resultado se devuelve a la app en la misma llamada.

const SPECIES_ID = /^[a-z0-9-]{1,80}$/;
const PACK_ID = /^[A-Za-z0-9_-]{1,80}$/;

function signedInUid(request: CallableRequest): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Inicia sesión.');
  return request.auth.uid;
}

function textFrom(value: unknown, pattern: RegExp, field: string): string {
  if (typeof value !== 'string' || !pattern.test(value)) throw new HttpsError('invalid-argument', `Falta ${field}.`);
  return value;
}

const userRef = (uid: string) => getFirestore().collection('users').doc(uid);
export const walletRef = (uid: string) => userRef(uid).collection('economy').doc('wallet');
const pieceRef = (uid: string, speciesId: string) => userRef(uid).collection('pieces').doc(speciesId);
const stickerRef = (uid: string, speciesId: string) => userRef(uid).collection('stickers').doc(speciesId);

const countsOf = (snapshot: DocumentSnapshot) => (snapshot.exists ? toPieceCounts(snapshot.data()!) : NO_PIECES);
const walletOf = (snapshot: DocumentSnapshot) => toWallet(snapshot.data());
const stickerOf = (snapshot: DocumentSnapshot) => (snapshot.exists ? toSticker(snapshot.id, snapshot.data()!) : null);

/**
 * SobreAbrir: { packId } → { speciesId, finish, upgraded, at }. Lo que trae se decide aquí. Un sobre ya
 * abierto devuelve lo que trajo: un doble toque o un reintento nunca dan dos piezas.
 */
export const openPack = onCall(async (request) => {
  const uid = signedInUid(request);
  const packId = textFrom((request.data as Record<string, unknown>)?.packId, PACK_ID, 'el sobre');
  const packRef = userRef(uid).collection('packs').doc(packId);

  const opening = await getFirestore().runTransaction(async (tx) => {
    const pack = await tx.get(packRef);
    if (!pack.exists) throw new HttpsError('not-found', 'No encontramos ese sobre.');
    const data = pack.data()!;
    if (data.opening) return data.opening as ReturnType<typeof openingDocument>;

    const speciesIds = (Array.isArray(data.speciesIds) ? data.speciesIds : []).map(String);
    if (speciesIds.length === 0) throw new HttpsError('failed-precondition', 'El sobre está vacío.');
    const speciesId = packSpecies(speciesIds, Math.random());
    const finish = packFinish(Math.random());
    const [stickerDoc, pieceDoc] = await Promise.all([tx.get(stickerRef(uid, speciesId)), tx.get(pieceRef(uid, speciesId))]);
    const sticker = stickerOf(stickerDoc);
    if (!sticker) throw new HttpsError('failed-precondition', 'No tienes esa ave en tu álbum.');

    const now = new Date();
    const result = applyPackPiece({ sticker, counts: countsOf(pieceDoc), finish, at: now });
    const document = openingDocument({ speciesId, finish, upgraded: result.upgraded, at: now });
    if (result.upgraded) tx.set(stickerRef(uid, speciesId), stickerDocument(result.sticker));
    else tx.set(pieceRef(uid, speciesId), piecesDocument(result.counts));
    tx.update(packRef, { opened: true, opening: document });
    return document;
  });
  logger.info('Sobre abierto', { uid, packId, finish: opening.finish, upgraded: opening.upgraded });
  return { ...opening, at: opening.at.toDate().toISOString() };
});

const pieceFinishFrom = (value: unknown): PieceFinish => {
  const finish = PIECE_FINISHES.find((f) => f === value);
  if (!finish) throw new HttpsError('invalid-argument', 'Falta el acabado.');
  return finish;
};

/** MisRepetidas: { speciesId, finish } → { feathers }. */
export const recyclePiece = onCall(async (request) => {
  const uid = signedInUid(request);
  const data = (request.data ?? {}) as Record<string, unknown>;
  const speciesId = textFrom(data.speciesId, SPECIES_ID, 'la especie');
  const finish = pieceFinishFrom(data.finish);

  const feathers = await getFirestore().runTransaction(async (tx) => {
    const [pieceDoc, walletDoc] = await Promise.all([tx.get(pieceRef(uid, speciesId)), tx.get(walletRef(uid))]);
    const result = recycle(walletOf(walletDoc), countsOf(pieceDoc), finish);
    if (!result) throw new HttpsError('failed-precondition', 'no-piece');
    tx.set(pieceRef(uid, speciesId), piecesDocument(result.counts));
    tx.set(walletRef(uid), walletDocument(result.wallet));
    return result.feathers;
  });
  logger.info('Repetida reciclada', { uid, speciesId, finish, feathers });
  return { feathers };
});

const finishFrom = (value: unknown): CardCategory => {
  if (typeof value !== 'string' || !(value in CATEGORY_RANK)) throw new HttpsError('invalid-argument', 'Falta el acabado.');
  return value as CardCategory;
};

async function buy(tx: Transaction, uid: string, speciesId: string, finish: CardCategory) {
  const [stickerDoc, walletDoc] = await Promise.all([tx.get(stickerRef(uid, speciesId)), tx.get(walletRef(uid))]);
  const sticker = stickerOf(stickerDoc);
  const wallet = walletOf(walletDoc);
  const now = new Date();
  const problem = purchaseProblem({ sticker, wallet, finish, at: now });
  // Lo normal es que la app ya lo haya impedido: esto cubre un saldo que cambió o un cliente viejo.
  if (problem) throw new HttpsError('failed-precondition', problem);
  const result = applyPurchase({ sticker: sticker!, wallet, finish, at: now });
  tx.set(stickerRef(uid, speciesId), stickerDocument(result.sticker));
  tx.set(walletRef(uid), walletDocument(result.wallet));
}

/** CompraAcabado: { speciesId, finish } → {}. `finish` es el que la persona vio: un doble toque no sube dos niveles. */
export const buyFinish = onCall(async (request) => {
  const uid = signedInUid(request);
  const data = (request.data ?? {}) as Record<string, unknown>;
  const speciesId = textFrom(data.speciesId, SPECIES_ID, 'la especie');
  const finish = finishFrom(data.finish);
  await getFirestore().runTransaction((tx) => buy(tx, uid, speciesId, finish));
  logger.info('Acabado comprado', { uid, speciesId, finish, price: FINISH_PRICES[finish] });
  return {};
});
