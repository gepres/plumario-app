// Da stickers de muestra a una cuenta del emulador, para probar el álbum, las recompensas y los
// pósteres sin registrar ave por ave. Solo emuladores: nunca escribe en el proyecto real.
// Uso (desde la raíz, con pnpm emulators corriendo):
//   pnpm dev:stickers ana@ejemplo.com            → 12 stickers (algunos cromados)
//   pnpm dev:stickers ana@ejemplo.com --count 25
//   pnpm dev:stickers ana@ejemplo.com --clear    → le quita todos
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const [email] = process.argv.slice(2).filter((arg) => !arg.startsWith('--') && !/^\d+$/.test(arg));
const countArg = process.argv.indexOf('--count');
const count = countArg > 0 ? Number(process.argv[countArg + 1]) : 12;
const clear = process.argv.includes('--clear');

if (!email) {
  console.error('Falta el correo de la cuenta: pnpm dev:stickers <correo> [--count N] [--clear]');
  process.exit(1);
}

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
initializeApp({ projectId: 'demo-plumario' });

const user = await getAuth().getUserByEmail(email).catch(() => null);
if (!user) {
  console.error(`No hay una cuenta ${email} en el emulador de Auth. Créala desde la app primero.`);
  process.exit(1);
}

const db = getFirestore();
const stickers = db.collection('users').doc(user.uid).collection('stickers');

if (clear) {
  const existing = await stickers.listDocuments();
  await Promise.all(existing.map((doc) => doc.delete()));
  console.log(`${existing.length} stickers borrados de ${email}.`);
  process.exit(0);
}

const { species, region } = JSON.parse(await readFile(join(ROOT, 'data', 'species', 'ica.json'), 'utf8'));
const album = species.filter((s) => s.taxonClass === region.albumClass);

// Las mismas reglas que categoryOf de @plumario/core.
const categoryOf = (s) =>
  ['VU', 'EN', 'CR'].includes(s.iucn) ? 'diamond' : s.emblematic ? 'ruby' : s.endemic ? 'gold' : s.iucn === 'NT' ? 'silver' : 'holographic';

// Primero unas especies de cada categoría (para ver todos los acabados) y después al azar, con una
// semilla fija para que dos corridas den lo mismo.
const featured = ['calidris-alba', 'larus-belcheri', 'larosterna-inca', 'spheniscus-humboldti', 'pelecanus-thagus', 'cinclodes-taczanowskii', 'phoenicopterus-chilensis'];
let seed = 20261024;
const random = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const rest = album.filter((s) => !featured.includes(s.id)).sort(() => random() - 0.5);
const chosen = [...featured.map((id) => album.find((s) => s.id === id)).filter(Boolean), ...rest].slice(0, count);

const now = Date.now();
const batch = db.batch();
chosen.forEach((s, i) => {
  const completedAt = Timestamp.fromMillis(now - (chosen.length - i) * 36e5 * 20);
  // Los seis primeros, cromados por vías distintas (holográfico, plata, diamante, rubí, oro); el
  // resto, normales con 1 a 4 fotos.
  const chrome = i < 6 ? { source: ['luck', 'photos', 'trade', 'luck', 'photos', 'trade'][i], at: completedAt } : null;
  batch.set(stickers.doc(s.id), {
    completedAt,
    validPhotos: chrome?.source === 'photos' ? 5 : 1 + Math.floor(random() * 4),
    chrome,
    category: categoryOf(s),
  });
});
await batch.commit();
console.log(`${chosen.length} stickers para ${email} (${user.uid}); cromados: ${chosen.slice(0, 6).map((s) => s.commonName).join(', ')}.`);
