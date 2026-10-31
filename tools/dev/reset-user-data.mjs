// Borra el avance de juego de todas las cuentas, para lanzar la fase 1 sin migrar datos
// (docs/card-progression.md). Conserva el catálogo, las cuentas y los perfiles.
//
// Por defecto solo cuenta lo que borraría, en el emulador. Para borrar hay que pedirlo:
//   node tools/dev/reset-user-data.mjs                        → emulador, solo cuenta
//   node tools/dev/reset-user-data.mjs --apply                → emulador, borra
//   node tools/dev/reset-user-data.mjs --prod                 → proyecto real, solo cuenta
//   node tools/dev/reset-user-data.mjs --prod --apply --confirm link-dynamic-74b85
//
// En el proyecto real necesita GOOGLE_APPLICATION_CREDENTIALS con la clave de la cuenta de servicio.
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const PRODUCTION = 'link-dynamic-74b85';
const DEMO = 'demo-plumario';
/** Lo que se borra de cada cuenta. Quedan el perfil, sus avisos y su @usuario. */
const USER_COLLECTIONS = ['stickers', 'sightings', 'photoClaims', 'achievements', 'posters', 'usage'];

const args = process.argv.slice(2);
const prod = args.includes('--prod');
const apply = args.includes('--apply');
const confirm = args.includes('--confirm') ? args[args.indexOf('--confirm') + 1] : null;

if (prod && apply && confirm !== PRODUCTION) {
  console.error(`Para borrar en el proyecto real hay que escribir su nombre: --confirm ${PRODUCTION}`);
  process.exit(1);
}

if (prod) {
  initializeApp({ credential: applicationDefault(), projectId: PRODUCTION, storageBucket: `${PRODUCTION}.firebasestorage.app` });
} else {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= '127.0.0.1:9199';
  initializeApp({ projectId: DEMO, storageBucket: `${DEMO}.appspot.com` });
}

const db = getFirestore();
const bucket = getStorage().bucket();
const counts = { cuentas: 0, documentos: 0, fotos: 0, propuestas: 0 };

async function resetUser(user) {
  counts.cuentas++;
  for (const name of USER_COLLECTIONS) {
    const collection = user.ref.collection(name);
    counts.documentos += (await collection.count().get()).data().count;
    if (apply) await db.recursiveDelete(collection);
  }
  const prefix = `users/${user.id}/photos/`;
  const [photos] = await bucket.getFiles({ prefix });
  counts.fotos += photos.length;
  if (apply && photos.length) await bucket.deleteFiles({ prefix });
}

// listDocuments también trae las cuentas que tienen registros pero no perfil.
const users = await db.collection('users').listDocuments();
for (const ref of users) await resetUser({ id: ref.id, ref });

const trades = db.collection('trades');
counts.propuestas = (await trades.count().get()).data().count;
if (apply) await db.recursiveDelete(trades);

const species = await db.collectionGroup('species').count().get();
const target = prod ? PRODUCTION : DEMO;
console.log(`${apply ? 'Borrado en' : 'Se borraría en'} ${target}:`, counts);
console.log(`El catálogo conserva ${species.data().count} especies.`);
