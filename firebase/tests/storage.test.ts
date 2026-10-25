import { readFileSync } from 'node:fs';

import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { getBytes, ref, uploadBytes } from 'firebase/storage';
import { afterAll, beforeAll, describe, it } from 'vitest';

// Reglas de firebase/storage.rules contra el emulador (pnpm test:rules desde la raíz).
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-plumario-rules',
    storage: { rules: readFileSync(new URL('../storage.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 9199 },
  });
});
afterAll(() => env.cleanup());

const storageOf = (uid: string) => env.authenticatedContext(uid).storage();
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

describe('fotos de los registros', () => {
  it('el dueño sube y ve sus fotos', async () => {
    const photo = ref(storageOf('ana'), 'users/ana/photos/a.jpg');
    await assertSucceeds(uploadBytes(photo, jpeg, { contentType: 'image/jpeg' }));
    await assertSucceeds(getBytes(photo));
  });

  it('nadie sube ni ve fotos ajenas', async () => {
    await assertFails(uploadBytes(ref(storageOf('beto'), 'users/ana/photos/b.jpg'), jpeg, { contentType: 'image/jpeg' }));
    await assertFails(getBytes(ref(storageOf('beto'), 'users/ana/photos/a.jpg')));
  });

  it('solo imágenes', async () => {
    await assertFails(uploadBytes(ref(storageOf('ana'), 'users/ana/photos/x.txt'), new TextEncoder().encode('hola'), { contentType: 'text/plain' }));
  });

  it('nada fuera de la carpeta de fotos del usuario', async () => {
    await assertFails(uploadBytes(ref(storageOf('ana'), 'public/a.jpg'), jpeg, { contentType: 'image/jpeg' }));
  });
});
