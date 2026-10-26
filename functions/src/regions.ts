import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { regionOpenedNotice } from './notices.js';
import { notifyUser } from './notify.js';

// Cuando abre una región (tools/species/seed.mjs crea regions/{id} con su catálogo), se avisa a
// quienes la pidieron con «Avísame cuando esté» (RegionLista: users/{uid}.regionAlerts).

export const onRegionCreated = onDocumentCreated('regions/{regionId}', async (event) => {
  const { regionId } = event.params;
  const name = String(event.data?.data()?.name ?? regionId);
  const waiting = await getFirestore().collection('users').where('regionAlerts', 'array-contains', regionId).get();
  let sent = 0;
  for (const user of waiting.docs) sent += await notifyUser(user.id, regionOpenedNotice(name));
  logger.info('Región abierta', { regionId, waiting: waiting.size, sent });
});
