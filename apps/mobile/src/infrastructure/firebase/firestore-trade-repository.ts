import { Timestamp, addDoc, collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from '@react-native-firebase/firestore';

import type { TradeProposal, TradeRepository, TradeResult, TradeStatus } from '@plumario/core';

import type { FirebaseServices } from './firebase-services';

// Adaptador de Firestore del puerto TradeRepository: trades/{id}. Quien propone la crea; para
// aceptarla se deja un pedido en trades/{id}/acceptances y la Cloud Function onTradeAcceptanceCreated
// responde en ese mismo documento.

const STATUSES: readonly TradeStatus[] = ['open', 'accepted', 'cancelled'];
/** Si el servidor no responde en este tiempo, se avisa en vez de esperar para siempre. */
const ACCEPT_TIMEOUT_MS = 45_000;

function toTrade(id: string, data: Record<string, unknown>): TradeProposal {
  return {
    id,
    fromUid: String(data.fromUid),
    fromHandle: String(data.fromHandle ?? ''),
    offeredSpeciesId: String(data.offeredSpeciesId),
    requestedSpeciesId: String(data.requestedSpeciesId),
    status: STATUSES.find((s) => s === data.status) ?? 'open',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(0),
  };
}

export function createFirestoreTradeRepository({ db }: FirebaseServices): TradeRepository {
  const trades = collection(db, 'trades');
  return {
    async create(proposal) {
      const ref = doc(trades);
      await setDoc(ref, { ...proposal, status: 'open', createdAt: Timestamp.fromDate(proposal.createdAt) });
      return ref.id;
    },

    async get(tradeId) {
      const snapshot = await getDoc(doc(trades, tradeId));
      const data = snapshot.data();
      return data ? toTrade(snapshot.id, data) : null;
    },

    async cancel(tradeId) {
      await updateDoc(doc(trades, tradeId), { status: 'cancelled' });
    },

    async accept(tradeId, userId) {
      const ref = await addDoc(collection(db, 'trades', tradeId, 'acceptances'), { uid: userId, createdAt: Timestamp.now() });
      return new Promise<TradeResult>((resolve, reject) => {
        const timer = setTimeout(() => {
          stop();
          reject(new Error('El servidor no respondió a tiempo'));
        }, ACCEPT_TIMEOUT_MS);
        const stop = onSnapshot(ref, {
          next: (snapshot) => {
            const result = snapshot.data()?.result as TradeResult | undefined;
            if (!result) return;
            clearTimeout(timer);
            stop();
            resolve(result);
          },
          error: (error) => {
            clearTimeout(timer);
            reject(error);
          },
        });
      });
    },
  };
}
