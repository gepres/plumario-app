import { describe, expect, it } from 'vitest';

import { DEFAULT_NOTIFICATIONS, notificationSettingsOf } from './notifications';

describe('preferencias de notificaciones', () => {
  it('sin nada guardado, todo encendido', () => {
    expect(notificationSettingsOf(undefined)).toEqual(DEFAULT_NOTIFICATIONS);
    expect(notificationSettingsOf('x')).toEqual(DEFAULT_NOTIFICATIONS);
  });

  it('solo apaga lo que está en false', () => {
    expect(notificationSettingsOf({ trades: false, regions: 'no' })).toEqual({ achievements: true, trades: false, regions: true });
  });
});
