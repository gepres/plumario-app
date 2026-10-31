import { getFirestore, Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { TRADES_PAUSED, applyTrade, tradeProblem, type TradeResult, type TradeSide } from '@plumario/core';

import { stickerDocument, toSticker } from './mappers.js';
import { tradeAcceptedNotice } from './notices.js';
import { notifyUser } from './notify.js';

// Aceptar una propuesta de intercambio (IntercambioRecibido): la app crea
// trades/{id}/acceptances/{acceptanceId} con su uid y el servidor hace el intercambio en una
// transacción, con los stickers de los dos tal como están en ese momento. La respuesta queda en la
// aceptación y la app la escucha. Las reglas no dejan que el cliente toque stickers ajenos ni propios.
// Mientras TRADES_PAUSED sea true se responde que no a todo: una app antigua no puede cambiar nada.

const finishOf = (snapshot: DocumentSnapshot) => (snapshot.exists ? toSticker(snapshot.id, snapshot.data()!).best : null) ?? 'holographic';

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

  let accepted: { fromUid: string; requestedSpeciesId: string } | null = null;
  const result = await db.runTransaction(async (tx): Promise<TradeResult | null> => {
    accepted = null;
    const [current, trade] = await Promise.all([tx.get(snapshot.ref), tx.get(tradeRef)]);
    // Reintento de la función: ya se respondió.
    if (current.data()?.result) return null;
    const data = trade.data();
    let answer: TradeResult;
    if (TRADES_PAUSED) answer = { outcome: 'rejected', reason: 'paused' };
    else if (!data || data.status !== 'open') answer = { outcome: 'rejected', reason: 'closed' };
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
      const offered = { speciesId: offeredId, category: finishOf(proposerOffered) };
      const requested = { speciesId: requestedId, category: finishOf(receiverRequested) };
      const problem = tradeProblem(proposer, receiver, offered, requested);
      if (problem) answer = { outcome: 'rejected', reason: problem };
      else {
        const now = new Date();
        const changes = applyTrade(proposer, receiver, offeredId, requestedId, now);
        for (const sticker of changes.proposer) tx.set(stickersOf(data.fromUid).doc(sticker.speciesId), stickerDocument(sticker));
        for (const sticker of changes.receiver) tx.set(stickersOf(uid).doc(sticker.speciesId), stickerDocument(sticker));
        tx.update(tradeRef, { status: 'accepted', acceptedBy: uid, acceptedAt: Timestamp.fromDate(now) });
        answer = { outcome: 'accepted' };
        accepted = { fromUid: String(data.fromUid), requestedSpeciesId: requestedId };
      }
    }
    tx.update(snapshot.ref, { result: answer, answeredAt: Timestamp.now() });
    return answer;
  });
  if (result) logger.info('Aceptación de intercambio', { tradeId, uid, outcome: result.outcome, reason: result.outcome === 'rejected' ? result.reason : undefined });
  if (accepted) await notifyProposer(accepted, uid);
});

/** Aviso a quien propuso: quién aceptó y qué cromo recibió (el que pidió). */
async function notifyProposer({ fromUid, requestedSpeciesId }: { fromUid: string; requestedSpeciesId: string }, receiverUid: string) {
  const db = getFirestore();
  const [receiver, proposer] = await Promise.all([db.collection('users').doc(receiverUid).get(), db.collection('users').doc(fromUid).get()]);
  const regionId = String(proposer.data()?.regionId ?? 'ica');
  const species = await db.collection('regions').doc(regionId).collection('species').doc(requestedSpeciesId).get();
  const speciesName = typeof species.data()?.commonName === 'string' ? String(species.data()?.commonName) : null;
  await notifyUser(fromUid, tradeAcceptedNotice({ handle: String(receiver.data()?.handle ?? 'alguien'), speciesName }));
}
