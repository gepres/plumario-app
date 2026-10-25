import type { Feedback } from '../../domain/feedback';

/** Puerto de salida: dónde llegan los comentarios (feedback/{id}); solo el equipo los lee. */
export interface FeedbackRepository {
  send(feedback: Feedback): Promise<void>;
}
