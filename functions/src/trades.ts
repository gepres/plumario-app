import { getFirestore, Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { applyTrade, CATEGORY_RANK, tradeProblem, type CardCategory, type TradeResult, type TradeSide } from '@plumario/core';

import { stickerDocument, toSticker } from './mappers.js';

// Aceptar una propuesta de intercambio (IntercambioRecibido): la app crea
// trades/{id}/acceptances/{acceptanceId} con su uid y el servidor hace el intercambio en una
// transacción, con los stickers de los dos tal como están en ese momento. La respuesta queda en la
// aceptación y la app la escucha. Las reglas no dejan que el cliente toque stickers ajenos ni propios.

const CATEGORIES = Object.keys(CATEGORY_RANK) as CardCategory[];
const categoryOf = (snapshot: DocumentSnapshot): CardCategory => CATEGORIES.find((c) => c === snapshot.data()?.category) ?? 'holographic';

/** Los stickers de una persona que entran en juego, por especie (los que no tiene, no están). */
function sideOf(snapshots: DocumentSnapshot[]): TradeSide {
  return { stickers: new Map(snapshots.filter((s) => s.exists).map((s) => [s.id, toSticker(s.id, s.data()!)])) };
}

export const onTradeAcceptanceCreated = onDocumentCreated('trades/{tradeId}/acceptances/{acceptanceId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot || snapshot.data()?.result) return;
  const uid = String(snapshot.data()?.uid ?? '');
  const { tradeId } = event.params;
  const db = getFirestore();
  const tradeRef = db.collection('trades').doc(tradeId);

  const result = await db.runTransaction(async (tx): Promise<TradeResult | null> => {
    const [current, trade] = await Promise.all([tx.get(snapshot.ref), tx.get(tradeRef)]);
    // Reintento de la función: ya se respondió.
    if (current.data()?.result) return null;
    const data = trade.data();
    let answer: TradeResult;
    if (!data || data.status !== 'open') answer = { outcome: 'rejected', reason: 'closed' };
    else if (data.fromUid === uid) answer = { outcome: 'rejected', reason: 'own-trade' };
    else {
      const offeredId = String(data.offeredSpeciesId);
      const requestedId = String(data.requestedSpeciesId);
      const stickersOf = (who: string) => db.collection('users').doc(who).collection('stickers');
      const [proposerOffered, proposerRequested, receiverOffered, receiverRequested] = await Promise.all([
        tx.get(stickersOf(data.fromUid).doc(offeredId)),
        tx.get(stickersOf(data.fromUid).doc(requestedId)),
        tx.get(stickersOf(uid).doc(offeredId)),
        tx.get(stickersOf(uid).doc(requestedId)),
      ]);
      const proposer = sideOf([proposerOffered, proposerRequested]);
      const receiver = sideOf([receiverOffered, receiverRequested]);
      // La categoría de cada especie la guardó el servidor en sus stickers; el cromo que se ofrece la
      // trae de quien propone y el que se pide, de quien recibe.
      const offered = { speciesId: offeredId, category: categoryOf(proposerOffered) };
      const requested = { speciesId: requestedId, category: categoryOf(receiverRequested) };
      const problem = tradeProblem(proposer, receiver, offered, requested);
      if (problem) answer = { outcome: 'rejected', reason: problem };
      else {
        const now = new Date();
        const changes = applyTrade(proposer, receiver, offeredId, requestedId, now);
        const categories: Record<string, CardCategory> = { [offeredId]: offered.category, [requestedId]: requested.category };
        for (const sticker of changes.proposer) tx.set(stickersOf(data.fromUid).doc(sticker.speciesId), stickerDocument(sticker, categories[sticker.speciesId]!));
        for (const sticker of changes.receiver) tx.set(stickersOf(uid).doc(sticker.speciesId), stickerDocument(sticker, categories[sticker.speciesId]!));
        tx.update(tradeRef, { status: 'accepted', acceptedBy: uid, acceptedAt: Timestamp.fromDate(now) });
        answer = { outcome: 'accepted' };
      }
    }
    tx.update(snapshot.ref, { result: answer, answeredAt: Timestamp.now() });
    return answer;
  });
  if (result) logger.info('Aceptación de intercambio', { tradeId, uid, outcome: result.outcome, reason: result.outcome === 'rejected' ? result.reason : undefined });
});
