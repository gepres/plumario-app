import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions/v2';

import { notificationSettingsOf } from '@plumario/core';

import type { Notice } from './notices.js';

// Manda un aviso push a los teléfonos de una persona (users/{uid}/devices, el id es el token), si
// quiere ese tipo de aviso (users/{uid}.notifications). Un aviso que no sale no rompe lo que lo
// pidió: se registra y sigue.

// Errores de FCM que dicen que el token ya no sirve (desinstaló la app, cerró sesión sin red…).
const STALE_TOKEN = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']);

export async function notifyUser(uid: string, notice: Notice): Promise<number> {
  try {
    const user = getFirestore().collection('users').doc(uid);
    const [profile, devices] = await Promise.all([user.get(), user.collection('devices').get()]);
    if (devices.empty || !notificationSettingsOf(profile.data()?.notifications)[notice.topic]) return 0;
    const tokens = devices.docs.map((device) => device.id);
    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title: notice.title, body: notice.body },
      data: { topic: notice.topic, path: notice.path },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
    const stale = response.responses.flatMap((r, i) => (!r.success && STALE_TOKEN.has(r.error?.code ?? '') ? [tokens[i]!] : []));
    await Promise.all(stale.map((token) => user.collection('devices').doc(token).delete()));
    logger.info('Aviso enviado', { uid, topic: notice.topic, sent: response.successCount, stale: stale.length });
    return response.successCount;
  } catch (error) {
    logger.warn('No se pudo enviar el aviso', { uid, topic: notice.topic, error: String(error) });
    return 0;
  }
}
