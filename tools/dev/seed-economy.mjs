// Da plumas, sobres y repetidas a una cuenta del emulador, para probar la fase 2A sin registrar ave por
// ave. Usa los stickers que ya tiene (pnpm dev:stickers). Solo emuladores: nunca escribe en el proyecto real.
// Uso (desde la raíz, con pnpm emulators corriendo):
//   pnpm dev:economy ana@ejemplo.com                → 60 plumas, 2 sobres y 3 repetidas
//   pnpm dev:economy ana@ejemplo.com --feathers 500 --packs 5
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index > 0 ? Number(process.argv[index + 1]) : fallback;
};
const [email] = process.argv.slice(2).filter((arg) => !arg.startsWith('--') && !/^\d+$/.test(arg));
const feathers = option('--feathers', 60);
const packs = option('--packs', 2);

if (!email) {
  console.error('Falta el correo de la cuenta: pnpm dev:economy <correo> [--feathers N] [--packs N]');
  process.exit(1);
}

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
initializeApp({ projectId: 'demo-plumario' });

const user = await getAuth().getUserByEmail(email).catch(() => null);
if (!user) {
  console.error(`No existe la cuenta ${email} en el emulador.`);
  process.exit(1);
}
const db = getFirestore();
const ref = db.collection('users').doc(user.uid);
const stickers = (await ref.collection('stickers').get()).docs.map((doc) => doc.id);
if (stickers.length < 3) {
  console.error('La cuenta necesita al menos 3 stickers: pnpm dev:stickers <correo>.');
  process.exit(1);
}

const pick = (offset) => stickers[offset % stickers.length];
const designs = ['nasca', 'pelicans', 'paracas'];
await ref.collection('economy').doc('wallet').set({ feathers, packSpecies: [pick(0)], premiumMonth: null });
for (let i = 0; i < packs; i++) {
  await ref.collection('packs').doc(`muestra-${Date.now()}-${i}`).set({
    speciesIds: [pick(i), pick(i + 1), pick(i + 2)],
    design: designs[i % designs.length],
    createdAt: Timestamp.now(),
    opened: false,
    opening: null,
  });
}
await ref.collection('pieces').doc(pick(0)).set({ silver: 2, gold: 1, ruby: 0, diamond: 0 });
await ref.collection('pieces').doc(pick(1)).set({ silver: 0, gold: 0, ruby: 1, diamond: 0 });
console.log(`${email}: ${feathers} plumas, ${packs} sobres y 4 repetidas.`);
