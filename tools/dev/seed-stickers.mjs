// Da stickers de muestra a una cuenta del emulador, para probar el álbum, las recompensas y los
// pósteres sin registrar ave por ave. Solo emuladores: nunca escribe en el proyecto real.
// Uso (desde la raíz, con pnpm emulators corriendo):
//   pnpm dev:stickers ana@ejemplo.com            → 12 stickers (algunos cromados)
//   pnpm dev:stickers ana@ejemplo.com --count 25
//   pnpm dev:stickers ana@ejemplo.com --clear    → le quita todos (los logros quedan)
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

// Los mismos hitos que MILESTONES de @plumario/core.
const MILESTONES = [
  { observations: 3, finish: 'holographic' },
  { observations: 5, finish: 'silver' },
  { observations: 10, finish: 'gold' },
  { observations: 20, finish: 'ruby' },
  { observations: 35, finish: 'diamond' },
];

// Primero unas especies conocidas y después al azar, con una semilla fija para que dos corridas den
// lo mismo.
const featured = ['calidris-alba', 'larus-belcheri', 'larosterna-inca', 'spheniscus-humboldti', 'pelecanus-thagus', 'cinclodes-taczanowskii', 'phoenicopterus-chilensis'];
let seed = 20261024;
const random = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const rest = album.filter((s) => !featured.includes(s.id)).sort(() => random() - 0.5);
const chosen = [...featured.map((id) => album.find((s) => s.id === id)).filter(Boolean), ...rest].slice(0, count);

const LIMA_OFFSET = 5 * 36e5;
const DAY = 24 * 36e5;
const now = Date.now();
const batch = db.batch();
chosen.forEach((s, i) => {
  const completedAt = Timestamp.fromMillis(now - (chosen.length - i) * 36e5 * 20);
  // Los seis primeros muestran todos los acabados (el primero, por suerte); el resto, normales con
  // 1 o 2 observaciones.
  const observations = [1, 5, 35, 20, 10, 3][i] ?? 1 + Math.floor(random() * 2);
  const reached = MILESTONES.filter((m) => observations >= m.observations);
  const unlocked = reached.map((m) => ({ finish: m.finish, source: 'milestone', at: completedAt }));
  if (i === 0) unlocked.push({ finish: 'holographic', source: 'luck', at: completedAt });
  const best = unlocked.at(-1)?.finish ?? null;
  batch.set(stickers.doc(s.id), {
    completedAt,
    validPhotos: observations + Math.floor(random() * 3),
    observations,
    countedDays: Array.from({ length: observations }, (_, day) => Math.floor((completedAt.toMillis() - LIMA_OFFSET) / DAY) - day),
    serverDay: null,
    serverCount: 0,
    best,
    ownBest: best,
    claimedMilestone: reached.at(-1)?.observations ?? 0,
    unlocked,
  });
});
await batch.commit();

// Los logros que corresponden a esos stickers (las mismas reglas que earnedAchievements), ya vistos
// para no disparar celebraciones: los que se ganen después sí se celebran.
const registered = (await stickers.get()).size;
const earned = [
  ...(registered >= 1 ? [['first-bird', { kind: 'firstBird' }]] : []),
  ...(registered >= 5 ? [['explorer', { kind: 'explorer' }]] : []),
  ...Array.from({ length: Math.floor(registered / 10) }, (_, i) => [`milestone-${(i + 1) * 10}`, { kind: 'milestone', species: (i + 1) * 10 }]),
];
const achievements = db.collection('users').doc(user.uid).collection('achievements');
for (const [id, achievement] of earned) {
  const ref = achievements.doc(id);
  if (!(await ref.get()).exists) await ref.set({ ...achievement, earnedAt: Timestamp.fromMillis(now - 864e5), seen: true });
}
console.log(`${chosen.length} stickers para ${email} (${user.uid}); cromados: ${chosen.slice(0, 6).map((s) => s.commonName).join(', ')}.`);
