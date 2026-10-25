import type { UserId } from './sighting';

// «Enviar un comentario» (design/project/PerfilComentario.dc.html).

export type FeedbackKind = 'idea' | 'error' | 'bird' | 'other';

/** «Hasta 500 caracteres». */
export const FEEDBACK_MAX = 500;

export type Feedback = {
  userId: UserId;
  kind: FeedbackKind;
  text: string;
  /** «Pueden responderme a mi correo»: solo entonces va el correo. */
  replyTo: string | null;
  /** «Adjuntar una captura de pantalla»: la ruta de la imagen subida. */
  screenshotPath: string | null;
  /** Para entender un error: versión de la app y sistema. */
  appVersion: string;
  platform: string;
  createdAt: Date;
};
