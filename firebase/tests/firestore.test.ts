import { readFileSync } from 'node:fs';

import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { Timestamp, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

// Reglas de firebase/firestore.rules contra el emulador (pnpm test:rules desde la raíz).
let env: RulesTestEnvironment;
const now = Timestamp.fromDate(new Date(2026, 9, 24));

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-plumario-rules',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(() => env.cleanup());
beforeEach(() => env.clearFirestore());

const as = (uid: string) => env.authenticatedContext(uid).firestore();
const anonymous = () => env.unauthenticatedContext().firestore();
const seed = (path: string, data: Record<string, unknown>) =>
  env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), path), data));

const profile = { displayName: 'Ana', handle: 'ana.ica', regionId: 'ica', privacy: { saveLocation: false, albumVisibility: 'private' }, createdAt: now };
const sighting = (uid: string) => ({ speciesId: 'calidris-alba', regionId: 'ica', takenAt: now, status: 'pending', photoPath: `users/${uid}/photos/a.jpg`, location: null, createdAt: now });

describe('catálogo', () => {
  it('se lee sin sesión y nadie lo escribe', async () => {
    await seed('regions/ica/species/calidris-alba', { commonName: 'Playero Arenero' });
    await assertSucceeds(getDoc(doc(anonymous(), 'regions/ica/species/calidris-alba')));
    await assertFails(setDoc(doc(as('ana'), 'regions/ica/species/x'), { commonName: 'x' }));
  });
});

// Crea el perfil y reserva su @usuario en la misma escritura, como hace la app al registrarse.
function createProfile(uid: string, data: Record<string, unknown>, handle = String(data.handle)) {
  const db = as(uid);
  const batch = writeBatch(db);
  batch.set(doc(db, `handles/${handle}`), { uid, createdAt: now });
  batch.set(doc(db, `users/${uid}`), data);
  return batch.commit();
}

describe('perfil', () => {
  it('cada uno crea el suyo reservando su @usuario, y nadie lee el ajeno', async () => {
    await assertSucceeds(createProfile('ana', profile));
    await assertSucceeds(getDoc(doc(as('ana'), 'users/ana')));
    await assertFails(getDoc(doc(as('beto'), 'users/ana')));
  });

  it('sin reservar el @usuario, o con uno de otro, no se crea', async () => {
    await assertFails(setDoc(doc(as('ana'), 'users/ana'), profile));
    await seed('handles/ana.ica', { uid: 'beto', createdAt: now });
    await assertFails(setDoc(doc(as('ana'), 'users/ana'), profile));
  });

  it('valida los campos y no deja cambiar la fecha de alta ni el @usuario', async () => {
    await assertFails(createProfile('ana', { ...profile, admin: true }));
    await seed('handles/ana.ica', { uid: 'ana', createdAt: now });
    await seed('users/ana', profile);
    await assertSucceeds(updateDoc(doc(as('ana'), 'users/ana'), { displayName: 'Ana P.' }));
    await assertFails(updateDoc(doc(as('ana'), 'users/ana'), { createdAt: Timestamp.now() }));
    await assertFails(updateDoc(doc(as('ana'), 'users/ana'), { handle: 'otra' }));
  });

  it('guarda el ave favorita y la privacidad completa', async () => {
    await seed('users/ana', profile);
    const privacy = { saveLocation: true, albumVisibility: 'link', showName: false, improveAi: true };
    await assertSucceeds(updateDoc(doc(as('ana'), 'users/ana'), { favoriteSpeciesId: 'calidris-alba', privacy, regionAlerts: ['are', 'cus'] }));
    await assertFails(updateDoc(doc(as('ana'), 'users/ana'), { regionAlerts: 'are' }));
    await assertFails(updateDoc(doc(as('ana'), 'users/ana'), { privacy: { ...privacy, albumVisibility: 'amigos' } }));
    await assertFails(updateDoc(doc(as('ana'), 'users/ana'), { privacy: { ...privacy, extra: true } }));
  });

  it('guarda qué notificaciones quiere, y nada más', async () => {
    await seed('users/ana', profile);
    await assertSucceeds(updateDoc(doc(as('ana'), 'users/ana'), { notifications: { achievements: true, trades: false, regions: true } }));
    await assertFails(updateDoc(doc(as('ana'), 'users/ana'), { notifications: { trades: 'no' } }));
    await assertFails(updateDoc(doc(as('ana'), 'users/ana'), { notifications: { spam: true } }));
  });

  it('cambia el @usuario reservando el nuevo y liberando el anterior, una vez cada 30 días', async () => {
    await seed('handles/ana.ica', { uid: 'ana', createdAt: now });
    await seed('users/ana', profile);
    const change = (from: string, to: string) => {
      const db = as('ana');
      const batch = writeBatch(db);
      batch.set(doc(db, `handles/${to}`), { uid: 'ana', createdAt: now });
      batch.delete(doc(db, `handles/${from}`));
      batch.update(doc(db, 'users/ana'), { handle: to, handleChangedAt: serverTimestamp() });
      return batch.commit();
    };
    await assertSucceeds(change('ana.ica', 'ana.paracas'));
    // Antes de 30 días, no.
    await assertFails(change('ana.paracas', 'ana.pisco'));
    // Sin reservar el nuevo, tampoco.
    await seed('users/beto', { ...profile, handle: 'beto.ica' });
    await assertFails(updateDoc(doc(as('beto'), 'users/beto'), { handle: 'beto.nuevo', handleChangedAt: serverTimestamp() }));
  });

  it('un @usuario en uso no se libera', async () => {
    await seed('handles/ana.ica', { uid: 'ana', createdAt: now });
    await seed('users/ana', profile);
    await assertFails(deleteDoc(doc(as('ana'), 'handles/ana.ica')));
    await assertFails(deleteDoc(doc(as('beto'), 'handles/ana.ica')));
  });
});

describe('comentarios', () => {
  const feedback = { userId: 'ana', kind: 'idea', text: 'Más aves de Paracas', replyTo: 'ana@ejemplo.com', screenshotPath: null, appVersion: '1.0.0', platform: 'android', createdAt: now };

  it('se envían a nombre propio y nadie los lee desde la app', async () => {
    await assertSucceeds(setDoc(doc(as('ana'), 'feedback/f1'), feedback));
    await assertFails(setDoc(doc(as('beto'), 'feedback/f2'), feedback));
    await assertFails(setDoc(doc(as('ana'), 'feedback/f3'), { ...feedback, text: 'x'.repeat(501) }));
    await assertFails(setDoc(doc(as('ana'), 'feedback/f4'), { ...feedback, kind: 'spam' }));
    await assertFails(getDoc(doc(as('ana'), 'feedback/f1')));
  });
});

describe('@usuarios', () => {
  it('se consulta uno sin sesión (para ver si está libre), pero no se listan', async () => {
    await seed('handles/ana.ica', { uid: 'ana', createdAt: now });
    await assertSucceeds(getDoc(doc(anonymous(), 'handles/ana.ica')));
    await assertFails(getDocs(collection(as('beto'), 'handles')));
  });

  it('cada uno reserva a su nombre uno libre y válido; no se pisa uno ajeno', async () => {
    await assertSucceeds(setDoc(doc(as('ana'), 'handles/ana.ica'), { uid: 'ana', createdAt: now }));
    await assertFails(setDoc(doc(as('beto'), 'handles/ana.ica'), { uid: 'beto', createdAt: now }));
    await assertFails(setDoc(doc(as('beto'), 'handles/Beto Mayus'), { uid: 'beto', createdAt: now }));
    await assertFails(setDoc(doc(as('beto'), 'handles/beto'), { uid: 'ana', createdAt: now }));
  });
});

describe('registros', () => {
  beforeEach(async () => {
    await seed('regions/ica/species/calidris-alba', { commonName: 'Playero Arenero', threatened: false });
    await seed('regions/ica/species/spheniscus-humboldti', { commonName: 'Pingüino de Humboldt', threatened: true });
  });

  it('guarda el lugar, salvo en una especie amenazada', async () => {
    await assertSucceeds(setDoc(doc(as('ana'), 'users/ana/sightings/s1'), { ...sighting('ana'), placeName: 'Paracas' }));
    const pinguino = { ...sighting('ana'), speciesId: 'spheniscus-humboldti' };
    await assertSucceeds(setDoc(doc(as('ana'), 'users/ana/sightings/s2'), { ...pinguino, placeName: null }));
    await assertFails(setDoc(doc(as('ana'), 'users/ana/sightings/s3'), { ...pinguino, placeName: 'Islas Ballestas' }));
    await assertFails(setDoc(doc(as('ana'), 'users/ana/sightings/s4'), { ...pinguino, location: { latitude: -13.8, longitude: -76.3 } }));
    await assertFails(setDoc(doc(as('ana'), 'users/ana/sightings/s5'), { ...sighting('ana'), placeName: 'x'.repeat(61) }));
  });

  it('el dueño crea uno pendiente con su foto', async () => {
    await assertSucceeds(setDoc(doc(as('ana'), 'users/ana/sightings/s1'), sighting('ana')));
    await assertSucceeds(setDoc(doc(as('ana'), 'users/ana/sightings/s2'), { ...sighting('ana'), location: { latitude: -13.8, longitude: -76.3 } }));
  });

  it('no puede darse por validado, ni usar la foto de otro, ni editarlo después', async () => {
    await assertFails(setDoc(doc(as('ana'), 'users/ana/sightings/s1'), { ...sighting('ana'), status: 'validated' }));
    await assertFails(setDoc(doc(as('ana'), 'users/ana/sightings/s1'), { ...sighting('ana'), photoPath: 'users/beto/photos/b.jpg' }));
    await seed('users/ana/sightings/s1', sighting('ana'));
    await assertFails(updateDoc(doc(as('ana'), 'users/ana/sightings/s1'), { status: 'validated' }));
  });

  it('nadie ve los registros ajenos (ni su ubicación)', async () => {
    await seed('users/ana/sightings/s1', sighting('ana'));
    await assertFails(getDoc(doc(as('beto'), 'users/ana/sightings/s1')));
  });
});

describe('stickers y logros', () => {
  it('los stickers los lee su dueño y no los escribe nadie desde la app', async () => {
    await seed('users/ana/stickers/calidris-alba', { validPhotos: 1, chrome: null });
    await assertSucceeds(getDoc(doc(as('ana'), 'users/ana/stickers/calidris-alba')));
    await assertFails(setDoc(doc(as('ana'), 'users/ana/stickers/calidris-alba'), { validPhotos: 5, chrome: { source: 'photos' } }));
  });

  it('de un logro, el dueño solo puede marcar que ya lo vio', async () => {
    await seed('users/ana/achievements/first-bird', { kind: 'firstBird', earnedAt: now, seen: false });
    await assertSucceeds(updateDoc(doc(as('ana'), 'users/ana/achievements/first-bird'), { seen: true }));
    await assertFails(updateDoc(doc(as('ana'), 'users/ana/achievements/first-bird'), { kind: 'albumComplete' }));
    await assertFails(setDoc(doc(as('ana'), 'users/ana/achievements/album-complete'), { kind: 'albumComplete', earnedAt: now, seen: false }));
  });
});

describe('pósteres', () => {
  const poster = { kind: 'species', number: 1, habitat: null, speciesIds: ['a', 'b'], seed: 42, theme: 'light', title: 'Póster 1', savedAt: now };
  it('el dueño guarda los suyos con datos válidos', async () => {
    await assertSucceeds(setDoc(doc(as('ana'), 'users/ana/posters/p1'), poster));
    await assertFails(setDoc(doc(as('ana'), 'users/ana/posters/p2'), { ...poster, theme: 'neón' }));
    await assertFails(setDoc(doc(as('beto'), 'users/ana/posters/p3'), poster));
  });
});

describe('teléfonos para los avisos', () => {
  const device = () => ({ platform: 'android', updatedAt: serverTimestamp() });
  it('el dueño registra y borra los suyos; nadie toca los ajenos', async () => {
    await assertSucceeds(setDoc(doc(as('ana'), 'users/ana/devices/tok-1'), device()));
    await assertSucceeds(getDoc(doc(as('ana'), 'users/ana/devices/tok-1')));
    await assertFails(getDoc(doc(as('beto'), 'users/ana/devices/tok-1')));
    await assertFails(setDoc(doc(as('beto'), 'users/ana/devices/tok-2'), device()));
    await assertFails(deleteDoc(doc(as('beto'), 'users/ana/devices/tok-1')));
    await assertSucceeds(deleteDoc(doc(as('ana'), 'users/ana/devices/tok-1')));
  });

  it('solo con la plataforma y la fecha del servidor', async () => {
    await assertFails(setDoc(doc(as('ana'), 'users/ana/devices/tok-1'), { platform: 'windows', updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(as('ana'), 'users/ana/devices/tok-1'), { platform: 'android', updatedAt: now }));
    await assertFails(setDoc(doc(as('ana'), 'users/ana/devices/tok-1'), { ...device(), uid: 'ana' }));
  });
});

describe('intercambios', () => {
  const trade = { fromUid: 'ana', fromHandle: 'ana.ica', offeredSpeciesId: 'calidris-alba', requestedSpeciesId: 'larus-belcheri', status: 'open', createdAt: now };

  it('quien ofrece crea la propuesta abierta a su nombre y con su @usuario', async () => {
    await seed('users/ana', profile);
    await assertSucceeds(setDoc(doc(as('ana'), 'trades/t1'), trade));
    await assertFails(setDoc(doc(as('beto'), 'trades/t2'), trade));
    await assertFails(setDoc(doc(as('ana'), 'trades/t3'), { ...trade, status: 'accepted' }));
    await assertFails(setDoc(doc(as('ana'), 'trades/t4'), { ...trade, fromHandle: 'otra.persona' }));
  });

  it('la lee cualquiera con sesión que tenga el enlace, sin sesión no; solo se listan las propias', async () => {
    await seed('trades/t1', trade);
    await assertSucceeds(getDoc(doc(as('beto'), 'trades/t1')));
    await assertFails(getDoc(doc(anonymous(), 'trades/t1')));
    await assertFails(getDocs(collection(as('beto'), 'trades')));
    await assertSucceeds(getDocs(query(collection(as('ana'), 'trades'), where('fromUid', '==', 'ana'))));
  });

  it('la acepta otra persona mientras siga abierta; la respuesta la escribe el servidor', async () => {
    await seed('trades/t1', trade);
    const acceptance = { uid: 'beto', createdAt: now };
    await assertSucceeds(setDoc(doc(as('beto'), 'trades/t1/acceptances/a1'), acceptance));
    await assertSucceeds(getDoc(doc(as('beto'), 'trades/t1/acceptances/a1')));
    await assertFails(getDoc(doc(as('ana'), 'trades/t1/acceptances/a1')));
    await assertFails(setDoc(doc(as('beto'), 'trades/t1/acceptances/a2'), { ...acceptance, result: { outcome: 'accepted' } }));
    await assertFails(setDoc(doc(as('ana'), 'trades/t1/acceptances/a3'), { uid: 'ana', createdAt: now }));
    await assertFails(updateDoc(doc(as('beto'), 'trades/t1/acceptances/a1'), { result: { outcome: 'accepted' } }));
    await seed('trades/t2', { ...trade, status: 'cancelled' });
    await assertFails(setDoc(doc(as('beto'), 'trades/t2/acceptances/a1'), acceptance));
  });

  it('solo quien la propuso la cancela; aceptarla es cosa del servidor', async () => {
    await seed('trades/t1', trade);
    await assertFails(updateDoc(doc(as('beto'), 'trades/t1'), { status: 'cancelled' }));
    await assertFails(updateDoc(doc(as('beto'), 'trades/t1'), { status: 'accepted' }));
    await assertSucceeds(updateDoc(doc(as('ana'), 'trades/t1'), { status: 'cancelled' }));
  });
});

describe('el resto', () => {
  it('se deniega', async () => {
    await assertFails(getDoc(doc(as('ana'), 'admin/config')));
    await assertFails(setDoc(doc(as('ana'), 'cualquier/cosa'), { x: 1 }));
  });
});
