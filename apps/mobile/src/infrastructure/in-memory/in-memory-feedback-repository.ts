import type { Feedback, FeedbackRepository } from '@plumario/core';

/** Adaptador en memoria del puerto FeedbackRepository, para la vista web: los guarda y nada más. */
export class InMemoryFeedbackRepository implements FeedbackRepository {
  readonly sent: Feedback[] = [];

  async send(feedback: Feedback): Promise<void> {
    this.sent.push(feedback);
  }
}
