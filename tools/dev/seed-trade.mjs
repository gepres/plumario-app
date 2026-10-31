// Crea una propuesta de intercambio para una cuenta del emulador, de parte de una segunda persona
// (@beto.ica), para probar IntercambioRecibido sin otro teléfono. Solo emuladores.
// Uso (desde la raíz, con pnpm emulators corriendo y la cuenta con stickers de pnpm dev:stickers):
//   pnpm dev:trade ana@ejemplo.com
// Beto ofrece el cromo de una especie que la cuenta tiene normal y pide uno de sus cromos, del mismo
// acabado. Imprime el enlace para abrirlo en el emulador de Android.
// El intercambio está en pausa (fase 1): hasta que vuelva, el enlace abre TradePaused.
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const [email] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
if (!email) {
  console.error('Falta el correo de la cuenta que recibe: pnpm dev:trade <correo>');
  process.exit(1);
}

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
initializeApp({ projectId: 'demo-plumario' });

const auth = getAuth();
const db = getFirestore();
const receiver = await auth.getUserByEmail(email).catch(() => null);
if (!receiver) {
  console.error(`No hay una cuenta ${email} en el emulador de Auth.`);
  process.exit(1);
}

const mine = (await db.collection('users').doc(receiver.uid).collection('stickers').get()).docs.map((d) => ({ id: d.id, ...d.data() }));
const requested = mine.find((s) => s.best);
const offered = mine.find((s) => !s.best);
if (!requested || !offered) {
  console.error(`${email} necesita al menos un cromo y un sticker normal (pnpm dev:stickers ${email}).`);
  process.exit(1);
}

// Beto: cuenta, perfil y @usuario, como al registrarse.
const BETO = { email: 'beto@ejemplo.com', password: 'beto2027', handle: 'beto.ica' };
const beto = (await auth.getUserByEmail(BETO.email).catch(() => null)) ?? (await auth.createUser({ email: BETO.email, password: BETO.password, displayName: 'Beto' }));
const now = Timestamp.now();
await db.collection('handles').doc(BETO.handle).set({ uid: beto.uid, createdAt: now });
await db.collection('users').doc(beto.uid).set({
  displayName: 'Beto',
  handle: BETO.handle,
  regionId: 'ica',
  favoriteSpeciesId: null,
  privacy: { saveLocation: false, albumVisibility: 'private', showName: true, improveAi: false },
  handleChangedAt: null,
  regionAlerts: [],
  createdAt: now,
});
// Tiene el cromo que ofrece y el sticker normal del que pide.
const betoStickers = db.collection('users').doc(beto.uid).collection('stickers');
const sticker = { completedAt: now, validPhotos: 1, observations: 1, lastCountedAt: now, serverDay: null, serverCount: 0, claimedMilestone: 0 };
await betoStickers.doc(offered.id).set({ ...sticker, best: requested.best, ownBest: requested.best, unlocked: [{ finish: requested.best, source: 'luck', at: now }] });
await betoStickers.doc(requested.id).set({ ...sticker, best: null, ownBest: null, unlocked: [] });

const trade = await db.collection('trades').add({
  fromUid: beto.uid,
  fromHandle: BETO.handle,
  offeredSpeciesId: offered.id,
  requestedSpeciesId: requested.id,
  status: 'open',
  createdAt: now,
});
console.log(`@${BETO.handle} ofrece su cromo de ${offered.id} por el de ${requested.id} (${requested.best}).`);
console.log(`Enlace: plumario://trade/${trade.id}`);
console.log(`En el emulador: adb shell am start -a android.intent.action.VIEW -d "plumario://trade/${trade.id}" com.gepres.plumario`);
