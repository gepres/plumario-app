import type { UserId } from '../../domain/sighting';
import type { PushNotifications, PushPermission } from '../ports/push-notifications';

// Casos de uso de Perfil › Notificaciones. El permiso del sistema se pide cuando la persona activa
// las notificaciones, no al abrir la app: así entiende para qué es.

/** «Activar notificaciones»: pide el permiso si todavía no se preguntó y, con él, registra el teléfono. */
export function makeEnablePushNotifications({ push }: { push: PushNotifications }) {
  return async (userId: UserId): Promise<PushPermission> => {
    let permission = await push.permission();
    if (permission === 'undetermined') permission = await push.requestPermission();
    if (permission === 'granted') await push.register(userId);
    return permission;
  };
}

/** Al entrar con sesión: si ya hay permiso, registra el teléfono (el token del teléfono puede cambiar). */
export function makeRegisterDevice({ push }: { push: PushNotifications }) {
  return async (userId: UserId): Promise<void> => {
    if ((await push.permission()) === 'granted') await push.register(userId);
  };
}
