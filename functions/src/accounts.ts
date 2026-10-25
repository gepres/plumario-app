import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions/v2';
import * as functionsV1 from 'firebase-functions/v1';

import { REGION } from './health.js';

// «Eliminar tu cuenta» (PerfilPrivacidad): la app borra la cuenta de Auth y acá se borra todo lo
// suyo: perfil, registros, stickers, logros y pósteres, sus fotos, su @usuario (queda libre) y sus
// propuestas abiertas (se cancelan). Auth no tiene este trigger en la segunda generación.

export const onUserDeleted = functionsV1
  .region(REGION)
  .auth.user()
  .onDelete(async (user) => {
    const db = getFirestore();
    const { uid } = user;

    const [handles, trades] = await Promise.all([
      db.collection('handles').where('uid', '==', uid).get(),
      db.collection('trades').where('fromUid', '==', uid).where('status', '==', 'open').get(),
    ]);
    const batch = db.batch();
    for (const handle of handles.docs) batch.delete(handle.ref);
    for (const trade of trades.docs) batch.update(trade.ref, { status: 'cancelled' });
    await batch.commit();

    // El perfil y todo lo que cuelga de él (registros, stickers, logros, pósteres).
    await db.recursiveDelete(db.collection('users').doc(uid));
    await getStorage()
      .bucket()
      .deleteFiles({ prefix: `users/${uid}/` })
      .catch((error: unknown) => logger.warn('No se pudieron borrar las fotos', { uid, error: String(error) }));

    logger.info('Cuenta eliminada', { uid, handles: handles.size, trades: trades.size });
  });
