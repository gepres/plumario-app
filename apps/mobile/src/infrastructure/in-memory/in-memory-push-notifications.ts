import type { PushNotifications, PushPermission } from '@plumario/core';

/**
 * Adaptador en memoria del puerto PushNotifications, para la app sin Firebase: el permiso se da al
 * pedirlo y no llega ningún aviso.
 */
export function createInMemoryPushNotifications(): PushNotifications {
  let permission: PushPermission = 'undetermined';
  return {
    permission: async () => permission,
    requestPermission: async () => (permission = 'granted'),
    register: async () => undefined,
    unregister: async () => undefined,
    onForeground: () => () => undefined,
    onOpened: () => () => undefined,
    initialNotice: async () => null,
  };
}
