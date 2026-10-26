/**
 * Perfil › Notificaciones: los avisos que se pueden recibir en el teléfono. Logros: una medalla
 * nueva. Intercambios: alguien aceptó una propuesta tuya. Regiones: abrió una que pediste con
 * «Avísame cuando esté».
 */
export type NotificationTopic = 'achievements' | 'trades' | 'regions';

export const NOTIFICATION_TOPICS: readonly NotificationTopic[] = ['achievements', 'trades', 'regions'];

export type NotificationSettings = Record<NotificationTopic, boolean>;

/** Todo encendido: quien activa las notificaciones del teléfono espera recibirlas. */
export const DEFAULT_NOTIFICATIONS: NotificationSettings = { achievements: true, trades: true, regions: true };

/**
 * Las preferencias guardadas, tal como vengan. Lo que falta cuenta como encendido: los perfiles
 * creados antes no tienen el campo.
 */
export function notificationSettingsOf(value: unknown): NotificationSettings {
  const stored = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  return { achievements: stored.achievements !== false, trades: stored.trades !== false, regions: stored.regions !== false };
}
