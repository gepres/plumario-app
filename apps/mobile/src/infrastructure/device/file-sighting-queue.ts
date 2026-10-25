import { Directory, File, Paths } from 'expo-file-system';

import type { QueuedSighting, SightingQueue } from '@plumario/core';

// Adaptador del puerto SightingQueue con archivos de la app: cada registro sin subir guarda una copia
// de su foto en documents/pending/ (la de la cámara es temporal y el sistema puede borrarla) y la
// lista va en documents/pending/queue.json. Queda aunque se cierre la app.

type Stored = Omit<QueuedSighting, 'takenAt' | 'queuedAt'> & { takenAt: string; queuedAt: string };

const folder = () => {
  const dir = new Directory(Paths.document, 'pending');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
};
const listFile = () => new File(folder(), 'queue.json');

function read(): QueuedSighting[] {
  const file = listFile();
  if (!file.exists) return [];
  try {
    const stored = JSON.parse(file.textSync()) as Stored[];
    return stored.map((s) => ({ ...s, takenAt: new Date(s.takenAt), queuedAt: new Date(s.queuedAt) }));
  } catch {
    return [];
  }
}

async function save(items: QueuedSighting[]) {
  const stored: Stored[] = items.map((i) => ({ ...i, takenAt: i.takenAt.toISOString(), queuedAt: i.queuedAt.toISOString() }));
  await listFile().write(JSON.stringify(stored));
}

export function createFileSightingQueue(): SightingQueue {
  // Una operación a la vez: si dos registros se guardan seguidos, ninguno pisa la lista del otro.
  let chain: Promise<unknown> = Promise.resolve();
  const serial = <T>(task: () => Promise<T>): Promise<T> => {
    const next = chain.then(task, task);
    chain = next.catch(() => undefined);
    return next;
  };

  return {
    enqueue: (item) =>
      serial(async () => {
        const id = `${item.queuedAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
        const photo = new File(folder(), `${id}.jpg`);
        await new File(item.photoUri).copy(photo);
        const queued: QueuedSighting = { ...item, id, photoUri: photo.uri };
        await save([...read(), queued]);
        return queued;
      }),

    list: async (userId) => read().filter((i) => i.userId === userId),

    remove: (id) =>
      serial(async () => {
        const items = read();
        const item = items.find((i) => i.id === id);
        await save(items.filter((i) => i.id !== id));
        if (item) {
          const photo = new File(item.photoUri);
          if (photo.exists) photo.delete();
        }
      }),
  };
}
