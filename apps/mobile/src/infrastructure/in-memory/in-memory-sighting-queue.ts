import type { QueuedSighting, SightingQueue, UserId } from '@plumario/core';

/** Adaptador en memoria del puerto SightingQueue, para la vista web (que no se queda sin señal). */
export class InMemorySightingQueue implements SightingQueue {
  private items: QueuedSighting[] = [];
  private nextId = 1;

  async enqueue(item: Omit<QueuedSighting, 'id' | 'queuedAt'> & { queuedAt: Date }): Promise<QueuedSighting> {
    const queued = { ...item, id: `cola-${this.nextId++}` };
    this.items.push(queued);
    return queued;
  }

  async list(userId: UserId): Promise<readonly QueuedSighting[]> {
    return this.items.filter((i) => i.userId === userId);
  }

  async remove(id: string): Promise<void> {
    this.items = this.items.filter((i) => i.id !== id);
  }
}
