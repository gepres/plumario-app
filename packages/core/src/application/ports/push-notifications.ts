import type { NotificationTopic } from '../../domain/notifications';
import type { UserId } from '../../domain/sighting';

/** Si el teléfono deja mostrar notificaciones: sí, no, o todavía no se preguntó. */
export type PushPermission = 'granted' | 'denied' | 'undetermined';

/** Un aviso: el que llega con la app abierta o el que se tocó para abrirla. */
export type PushNotice = {
  title: string;
  body: string;
  topic: NotificationTopic | null;
  /** La pantalla que abre (una ruta de la app, como /rewards), si abre alguna. */
  path: string | null;
};

/**
 * Puerto de salida: las notificaciones del teléfono (FCM). El servidor manda los avisos a los
 * teléfonos registrados en la cuenta; la app pide el permiso, registra el teléfono y reacciona a
 * los avisos.
 */
export interface PushNotifications {
  permission(): Promise<PushPermission>;
  /** Pide el permiso al sistema (Android 13 o más, iOS). */
  requestPermission(): Promise<PushPermission>;
  /** Registra este teléfono en la cuenta para que le lleguen sus avisos; sigue al token si cambia. */
  register(userId: UserId): Promise<void>;
  /** Al cerrar sesión: este teléfono deja de recibir los avisos de la cuenta. */
  unregister(userId: UserId): Promise<void>;
  /** Avisos que llegan con la app abierta (el sistema no los muestra). Devuelve cómo dejar de escuchar. */
  onForeground(listener: (notice: PushNotice) => void): () => void;
  /** Avisos que se tocan con la app en segundo plano. */
  onOpened(listener: (notice: PushNotice) => void): () => void;
  /** El aviso que abrió la app, si estaba cerrada. */
  initialNotice(): Promise<PushNotice | null>;
}
