// Crea una propuesta de intercambio para una cuenta del emulador, de parte de una segunda persona
// (@beto.ica), para probar IntercambioRecibido sin otro teléfono. Solo emuladores.
// Uso (desde la raíz, con pnpm emulators corriendo y la cuenta con stickers de pnpm dev:stickers):
//   pnpm dev:trade ana@ejemplo.com
// Beto ofrece el cromo de una especie que la cuenta tiene normal y pide uno de sus cromos, de igual
// o menor categoría. Imprime el enlace para abrirlo en el emulador de Android.
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

// Las mismas categorías que CATEGORY_RANK de @plumario/core.
const RANK = { holographic: 0, silver: 1, gold: 2, ruby: 3, diamond: 4 };
const mine = (await db.collection('users').doc(receiver.uid).collection('stickers').get()).docs.map((d) => ({ id: d.id, ...d.data() }));
const chromed = mine.filter((s) => s.chrome).sort((a, b) => RANK[a.category] - RANK[b.category]);
const normal = mine.filter((s) => !s.chrome);
const requested = chromed[0];
const offered = requested && normal.find((s) => RANK[s.category] >= RANK[requested.category]);
if (!requested || !offered) {
  console.error(`${email} necesita al menos un cromo y un sticker normal de igual o mayor categoría (pnpm dev:stickers ${email}).`);
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
await betoStickers.doc(offered.id).set({ completedAt: now, validPhotos: 1, chrome: { source: 'luck', at: now }, category: offered.category });
await betoStickers.doc(requested.id).set({ completedAt: now, validPhotos: 1, chrome: null, category: requested.category });

const trade = await db.collection('trades').add({
  fromUid: beto.uid,
  fromHandle: BETO.handle,
  offeredSpeciesId: offered.id,
  requestedSpeciesId: requested.id,
  status: 'open',
  createdAt: now,
});
console.log(`@${BETO.handle} ofrece su cromo de ${offered.id} (${offered.category}) por el de ${requested.id} (${requested.category}).`);
console.log(`Enlace: plumario://trade/${trade.id}`);
console.log(`En el emulador: adb shell am start -a android.intent.action.VIEW -d "plumario://trade/${trade.id}" com.gepres.plumario`);
