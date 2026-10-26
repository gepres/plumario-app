import { describe, expect, it } from 'vitest';

import type { PushNotifications, PushPermission } from '../ports/push-notifications';
import { makeEnablePushNotifications, makeRegisterDevice } from './notifications';

/** Un teléfono de prueba: el permiso que tiene, el que daría al pedirlo y los registros que recibe. */
function fakePush(current: PushPermission, onRequest: PushPermission = current) {
  const registered: string[] = [];
  let asked = 0;
  const push: PushNotifications = {
    permission: async () => current,
    requestPermission: async () => {
      asked++;
      current = onRequest;
      return current;
    },
    register: async (userId) => void registered.push(userId),
    unregister: async () => undefined,
    onForeground: () => () => undefined,
    onOpened: () => () => undefined,
    initialNotice: async () => null,
  };
  return { push, registered, asked: () => asked };
}

describe('activar las notificaciones', () => {
  it('pide el permiso si no se preguntó y registra el teléfono si lo dan', async () => {
    const phone = fakePush('undetermined', 'granted');
    await expect(makeEnablePushNotifications(phone)('ana')).resolves.toBe('granted');
    expect(phone.asked()).toBe(1);
    expect(phone.registered).toEqual(['ana']);
  });

  it('si lo niegan, no registra nada', async () => {
    const phone = fakePush('undetermined', 'denied');
    await expect(makeEnablePushNotifications(phone)('ana')).resolves.toBe('denied');
    expect(phone.registered).toEqual([]);
  });

  it('si ya lo negó, no vuelve a preguntar', async () => {
    const phone = fakePush('denied');
    await makeEnablePushNotifications(phone)('ana');
    expect(phone.asked()).toBe(0);
  });
});

describe('registrar el teléfono al entrar', () => {
  it('solo con permiso, y sin pedirlo', async () => {
    const granted = fakePush('granted');
    await makeRegisterDevice(granted)('ana');
    expect(granted.registered).toEqual(['ana']);

    const undetermined = fakePush('undetermined', 'granted');
    await makeRegisterDevice(undetermined)('ana');
    expect(undetermined.asked()).toBe(0);
    expect(undetermined.registered).toEqual([]);
  });
});
