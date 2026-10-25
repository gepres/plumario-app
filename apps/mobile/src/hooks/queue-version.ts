import { createVersionStore } from './version-store';

// Cuándo hay que volver a leer la cola de registros sin subir: al guardar uno sin señal y al subirlos.

const queue = createVersionStore();

export const invalidateQueue = queue.invalidate;

export function useQueueVersion(): number {
  return queue.useVersion();
}
