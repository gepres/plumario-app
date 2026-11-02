import { Timestamp, collection, doc, getDoc, getDocs, query, where } from '@react-native-firebase/firestore';
import { httpsCallable } from '@react-native-firebase/functions';

import {
  EconomyError,
  PACK_DESIGNS,
  PIECE_FINISHES,
  type CardCategory,
  type EconomyErrorCode,
  type EconomyRepository,
  type Pack,
  type PackOpening,
  type PieceCounts,
  type PieceFinish,
  type Wallet,
} from '@plumario/core';

import type { FirebaseServices } from './firebase-services';

// Adaptador del puerto EconomyRepository: lee users/{uid}/economy, packs y pieces de Firestore, y pide
// lo demás a las Functions openPack, recyclePiece y buyFinish (functions/src/economy.ts). Las reglas no
// dejan que la app escriba nada de esto.

const count = (value: unknown) => (typeof value === 'number' ? value : 0);

function toWallet(data: Record<string, unknown> | undefined): Wallet {
  return {
    feathers: count(data?.feathers),
    packSpecies: Array.isArray(data?.packSpecies) ? data.packSpecies.map(String) : [],
    premiumMonth: typeof data?.premiumMonth === 'number' ? data.premiumMonth : null,
  };
}

const toCounts = (data: Record<string, unknown>) => Object.fromEntries(PIECE_FINISHES.map((finish) => [finish, count(data[finish])])) as PieceCounts;

function toPack(id: string, data: Record<string, unknown>): Pack {
  return {
    id,
    speciesIds: Array.isArray(data.speciesIds) ? data.speciesIds.map(String) : [],
    design: PACK_DESIGNS.find((design) => design === data.design) ?? PACK_DESIGNS[0],
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(0),
    opening: null,
  };
}

const CODES: readonly EconomyErrorCode[] = ['not-registered', 'top-finish', 'not-next', 'monthly-limit', 'not-enough', 'no-piece'];

/** El servidor manda el motivo como mensaje; lo demás (sin señal, un fallo) es «no se pudo». */
function toEconomyError(error: unknown): EconomyError {
  const message = error instanceof Error ? error.message : String(error);
  return new EconomyError(CODES.find((code) => message.includes(code)) ?? 'unavailable');
}

export function createFirestoreEconomyRepository({ db, functions }: FirebaseServices): EconomyRepository {
  const openPack = httpsCallable<{ packId: string }, Omit<PackOpening, 'at'> & { at: string }>(functions, 'openPack');
  const recyclePiece = httpsCallable<{ speciesId: string; finish: PieceFinish }, { feathers: number }>(functions, 'recyclePiece');
  const buyFinish = httpsCallable<{ speciesId: string; finish: CardCategory }, object>(functions, 'buyFinish');

  return {
    async get(userId) {
      const user = ['users', userId] as const;
      const [wallet, packs, pieces] = await Promise.all([
        getDoc(doc(db, ...user, 'economy', 'wallet')),
        getDocs(query(collection(db, ...user, 'packs'), where('opened', '==', false))),
        getDocs(collection(db, ...user, 'pieces')),
      ]);
      return {
        wallet: toWallet(wallet.data()),
        packs: packs.docs.map((d) => toPack(d.id, d.data())).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
        pieces: pieces.docs.map((d) => ({ speciesId: d.id, counts: toCounts(d.data()) })),
      };
    },
    async openPack(_userId, packId) {
      try {
        const { data } = await openPack({ packId });
        return { ...data, at: new Date(data.at) };
      } catch (error) {
        throw toEconomyError(error);
      }
    },
    async recyclePiece(_userId, speciesId, finish) {
      try {
        return (await recyclePiece({ speciesId, finish })).data.feathers;
      } catch (error) {
        throw toEconomyError(error);
      }
    },
    async buyFinish(_userId, speciesId, finish) {
      try {
        await buyFinish({ speciesId, finish });
      } catch (error) {
        throw toEconomyError(error);
      }
    },
  };
}
