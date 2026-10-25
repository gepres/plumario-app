// Carga data/species/ica.json en Firestore: regions/{regionId} y regions/{regionId}/species/{id}.
// Uso (desde la raíz):
//   pnpm species:seed           → emulador (127.0.0.1:8080, proyecto demo-plumario; pnpm emulators antes)
//   pnpm species:seed --prod    → proyecto real (alias prod de .firebaserc). Necesita credenciales de la cuenta dueña
//                                 (gcloud auth application-default login, o GOOGLE_APPLICATION_CREDENTIALS
//                                 con una cuenta de servicio) y que los hábitats del álbum estén revisados.
// Escribe con el Admin SDK, que no pasa por las reglas. Es idempotente: reescribe cada documento.
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CATALOG = join(ROOT, 'data', 'species', 'ica.json');
const prod = process.argv.includes('--prod');
const allowUnreviewed = process.argv.includes('--allow-unreviewed');
const BATCH_SIZE = 400; // Firestore admite hasta 500 escrituras por lote.

const catalog = JSON.parse(await readFile(CATALOG, 'utf8'));
const { region, species } = catalog;

// En el emulador, todo vive en el proyecto demo-plumario: con él corren los emuladores y la app, en
// modo emulador, se conecta con ese mismo proyecto. Con FIRESTORE_EMULATOR_HOST puesto, el Admin SDK
// nunca sale a la nube.

let targets;
if (prod) {
  const pending = species.filter((s) => s.taxonClass === region.albumClass && !s.habitatReviewed);
  if (pending.length && !allowUnreviewed) {
    console.error(`Hay ${pending.length} especies del álbum con el hábitat sin revisar (data/species/ica-habitats.xlsx).`);
    console.error('Revísalas y vuelve a correr pnpm species:convert, o usa --allow-unreviewed si es a propósito.');
    process.exit(1);
  }
  const firebaserc = JSON.parse(await readFile(join(ROOT, '.firebaserc'), 'utf8'));
  targets = [initializeApp({ projectId: firebaserc.projects.prod, credential: applicationDefault() })];
} else {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  targets = [initializeApp({ projectId: 'demo-plumario' })];
}

for (const app of targets) {
  const db = getFirestore(app);
  const regionRef = db.collection('regions').doc(region.id);
  await regionRef.set({
    name: region.name,
    albumClass: region.albumClass,
    speciesCount: species.length,
    albumCount: species.filter((s) => s.taxonClass === region.albumClass).length,
    updatedAt: new Date(),
  });
  for (let i = 0; i < species.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const { id, ...fields } of species.slice(i, i + BATCH_SIZE)) batch.set(regionRef.collection('species').doc(id), fields);
    await batch.commit();
  }
  const where = prod ? 'proyecto real' : `emulador ${process.env.FIRESTORE_EMULATOR_HOST}`;
  console.log(`${species.length} especies cargadas en regions/${region.id}/species de ${app.options.projectId} (${where}).`);
}
