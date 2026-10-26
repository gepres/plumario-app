import { getApp } from '@react-native-firebase/app';
import { deleteDoc, doc, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import {
  AuthorizationStatus,
  deleteToken,
  getInitialNotification,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

import { NOTIFICATION_TOPICS, type PushNotice, type PushNotifications, type PushPermission } from '@plumario/core';

import type { FirebaseServices } from './firebase-services';

// Adaptador de FCM del puerto PushNotifications. El token del teléfono se guarda en
// users/{uid}/devices/{token} y el servidor (functions/src/notify.ts) manda ahí los avisos. FCM usa
// siempre el proyecto real (el de google-services.json); con los emuladores, el teléfono se registra
// en la base del emulador, que no puede mandar avisos.

const messaging = () => getMessaging(getApp());

// Con la app cerrada o en segundo plano, los avisos los muestra el sistema y no hay nada que hacer;
// pero sin un manejador, React Native Firebase se queja en cada uno.
setBackgroundMessageHandler(messaging(), async () => undefined);

// Android 13 o más pide el permiso de notificaciones; antes, venía dado.
const ANDROID_ASKS = Platform.OS === 'android' && Number(Platform.Version) >= 33;

function toNotice(message: RemoteMessage): PushNotice {
  const data = message.data ?? {};
  const path = typeof data.path === 'string' && data.path.startsWith('/') ? data.path : null;
  return {
    title: message.notification?.title ?? '',
    body: message.notification?.body ?? '',
    topic: NOTIFICATION_TOPICS.find((t) => t === data.topic) ?? null,
    path,
  };
}

// Los permisos de iOS se piden con la API de messaging (marcada obsoleta en favor de librerías
// aparte, pero vigente). En Android, con la de React Native.
function fromIos(status: number): PushPermission {
  if (status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL || status === AuthorizationStatus.EPHEMERAL) return 'granted';
  return status === AuthorizationStatus.DENIED ? 'denied' : 'undetermined';
}

export function createFirebasePushNotifications({ db }: FirebaseServices): PushNotifications {
  let current: { userId: string; token: string } | null = null;
  let stopRefresh: (() => void) | null = null;

  const save = (userId: string, token: string) => setDoc(doc(db, 'users', userId, 'devices', token), { platform: Platform.OS === 'ios' ? 'ios' : 'android', updatedAt: serverTimestamp() });

  return {
    async permission() {
      if (Platform.OS === 'ios') return fromIos(await hasPermission(messaging()));
      if (!ANDROID_ASKS) return 'granted';
      return (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)) ? 'granted' : 'undetermined';
    },

    async requestPermission() {
      if (Platform.OS === 'ios') return fromIos(await requestPermission(messaging()));
      if (!ANDROID_ASKS) return 'granted';
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
    },

    async register(userId) {
      const token = await getToken(messaging());
      await save(userId, token);
      current = { userId, token };
      stopRefresh?.();
      stopRefresh = onTokenRefresh(messaging(), (fresh) => {
        if (current?.userId !== userId) return;
        const stale = current.token;
        current = { userId, token: fresh };
        void save(userId, fresh).then(() => deleteDoc(doc(db, 'users', userId, 'devices', stale)));
      });
    },

    async unregister(userId) {
      stopRefresh?.();
      stopRefresh = null;
      const token = current?.userId === userId ? current.token : await getToken(messaging()).catch(() => null);
      current = null;
      if (token) await deleteDoc(doc(db, 'users', userId, 'devices', token));
      // Un token nuevo para la próxima cuenta que entre en este teléfono.
      await deleteToken(messaging()).catch(() => undefined);
    },

    onForeground: (listener) => onMessage(messaging(), (message) => listener(toNotice(message))),
    onOpened: (listener) => onNotificationOpenedApp(messaging(), (message) => listener(toNotice(message))),
    initialNotice: async () => {
      const message = await getInitialNotification(messaging());
      return message ? toNotice(message) : null;
    },
  };
}
