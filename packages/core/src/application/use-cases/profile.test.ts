import { describe, expect, it } from 'vitest';

import { nextHandleChange, sharedName, DEFAULT_PRIVACY } from '../../domain/account';
import type { Feedback } from '../../domain/feedback';
import type { FeedbackRepository } from '../ports/feedback-repository';
import { HandleTakenError, type ProfileChanges, type UserProfileRepository } from '../ports/user-profile-repository';
import { FeedbackError, ProfileError, makeChangeHandle, makeSendFeedback, makeUpdateProfile } from './profile';

const day = (d: number) => new Date(2026, 9, d);

function fakeProfiles(taken: string[] = [], raceOn?: string) {
  const updates: ProfileChanges[] = [];
  const changes: [string, string][] = [];
  const profiles = {
    isHandleAvailable: async (h: string) => !taken.includes(h),
    update: async (_uid: string, c: ProfileChanges) => void updates.push(c),
    changeHandle: async (_uid: string, from: string, to: string) => {
      if (to === raceOn) throw new HandleTakenError(to);
      changes.push([from, to]);
    },
  } as unknown as UserProfileRepository;
  return { profiles, updates, changes };
}

describe('editar el perfil', () => {
  it('guarda el nombre sin espacios de más; vacío o muy largo, no', async () => {
    const { profiles, updates } = fakeProfiles();
    const update = makeUpdateProfile({ profiles });
    await update('u1', { displayName: '  Ana Pérez ', favoriteSpeciesId: 'parina' });
    expect(updates[0]).toEqual({ displayName: 'Ana Pérez', favoriteSpeciesId: 'parina' });
    await expect(update('u1', { displayName: '   ' })).rejects.toEqual(new ProfileError('name-empty'));
    await expect(update('u1', { displayName: 'x'.repeat(41) })).rejects.toEqual(new ProfileError('name-too-long'));
  });

  it('en lo que comparte firma con su nombre o, si lo prefiere, con su @usuario', () => {
    const profile = { displayName: 'Ana', handle: 'ana.ica', privacy: DEFAULT_PRIVACY };
    expect(sharedName(profile)).toBe('Ana');
    expect(sharedName({ ...profile, privacy: { ...DEFAULT_PRIVACY, showName: false } })).toBe('@ana.ica');
  });
});

describe('cambiar el @usuario', () => {
  const now = () => day(25);

  it('reserva el nuevo y libera el anterior', async () => {
    const { profiles, changes } = fakeProfiles();
    await expect(makeChangeHandle({ profiles, now })('u1', { handle: 'ana', handleChangedAt: null }, ' @Ana.Ica ')).resolves.toBe('ana.ica');
    expect(changes).toEqual([['ana', 'ana.ica']]);
  });

  it('se puede una vez cada 30 días', async () => {
    const { profiles } = fakeProfiles();
    const change = makeChangeHandle({ profiles, now });
    await expect(change('u1', { handle: 'ana', handleChangedAt: day(10) }, 'ana2')).rejects.toMatchObject({ problem: 'handle-too-soon' });
    expect(nextHandleChange({ handleChangedAt: day(10) }, day(25))).toEqual(new Date(day(10).getTime() + 30 * 864e5));
    expect(nextHandleChange({ handleChangedAt: new Date(2026, 8, 1) }, day(25))).toBeNull();
  });

  it('no se queda con uno ajeno, ni si otra persona lo toma en ese momento', async () => {
    const { profiles } = fakeProfiles(['beto'], 'carla');
    const change = makeChangeHandle({ profiles, now });
    await expect(change('u1', { handle: 'ana', handleChangedAt: null }, 'beto')).rejects.toEqual(new ProfileError('handle-taken'));
    await expect(change('u1', { handle: 'ana', handleChangedAt: null }, 'carla')).rejects.toEqual(new ProfileError('handle-taken'));
    await expect(change('u1', { handle: 'ana', handleChangedAt: null }, 'a b')).rejects.toEqual(new ProfileError('invalid-characters'));
  });
});

describe('enviar un comentario', () => {
  const sent: Feedback[] = [];
  const feedback: FeedbackRepository = { send: async (f) => void sent.push(f) };
  const send = makeSendFeedback({ feedback, now: () => day(25) });
  const input = { userId: 'u1', kind: 'idea' as const, replyTo: null, screenshotPath: null, appVersion: '1.0.0', platform: 'android' };

  it('llega con su fecha, sin espacios de más', async () => {
    await send({ ...input, text: '  Más aves de Paracas  ' });
    expect(sent[0]).toMatchObject({ text: 'Más aves de Paracas', createdAt: day(25) });
  });

  it('va de 1 a 500 caracteres', async () => {
    await expect(send({ ...input, text: '  ' })).rejects.toEqual(new FeedbackError('empty'));
    await expect(send({ ...input, text: 'x'.repeat(501) })).rejects.toEqual(new FeedbackError('too-long'));
  });
});
