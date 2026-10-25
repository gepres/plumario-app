import { describe, expect, it } from 'vitest';

import type { UserProfile } from '../../domain/account';
import { AuthError, type AuthService, type AuthUser } from '../ports/auth-service';
import { HandleTakenError, type UserProfileRepository } from '../ports/user-profile-repository';
import { makeSignUp, SignUpValidationError, signUpProblems, type SignUpInput } from './sign-up';

const valid: SignUpInput = {
  displayName: 'Ana', handle: '@Ana_Ica', email: 'ana@ejemplo.com', password: 'aves2026', acceptedTerms: true, ageConfirmed: true,
};

function fakes(takenHandles: string[] = [], { takenOnCreate = false } = {}) {
  const profiles = new Map<string, UserProfile>();
  const taken = new Set(takenHandles);
  let creates = 0;
  const auth = {
    signUp: async (email: string): Promise<AuthUser> => {
      if (email === 'usado@ejemplo.com') throw new AuthError('email-in-use');
      return { uid: 'u1', email };
    },
  } as unknown as AuthService;
  const repo: UserProfileRepository = {
    get: async (uid) => profiles.get(uid) ?? null,
    isHandleAvailable: async (h) => !taken.has(h),
    create: async (uid, profile) => {
      creates++;
      if (takenOnCreate && creates === 1) throw new HandleTakenError(profile.handle);
      profiles.set(uid, profile);
    },
    update: async () => {},
    changeHandle: async () => {},
  };
  return { auth, repo, profiles };
}

describe('signUpProblems', () => {
  it('un formulario completo no tiene problemas', () => {
    expect(signUpProblems(valid)).toEqual({});
  });
  it('marca cada campo que falta o está mal', () => {
    expect(signUpProblems({ ...valid, displayName: ' ', handle: 'a', email: 'x', password: 'corta', ageConfirmed: false })).toEqual({
      displayName: 'required', handle: 'too-short', email: 'invalid', password: 'weak', consent: 'required',
    });
  });
});

describe('signUp', () => {
  const now = () => new Date(2026, 9, 24);

  it('crea la cuenta y el perfil con el usuario normalizado', async () => {
    const { auth, repo, profiles } = fakes();
    const user = await makeSignUp({ auth, profiles: repo, now })(valid);
    expect(user.uid).toBe('u1');
    expect(profiles.get('u1')).toMatchObject({ displayName: 'Ana', handle: 'ana_ica', regionId: 'ica' });
  });

  it('no crea la cuenta si el formulario está incompleto o el usuario está tomado', async () => {
    const { auth, repo } = fakes(['ana_ica']);
    await expect(makeSignUp({ auth, profiles: repo, now })({ ...valid, acceptedTerms: false })).rejects.toBeInstanceOf(SignUpValidationError);
    await expect(makeSignUp({ auth, profiles: repo, now })(valid)).rejects.toMatchObject({ problems: { handle: 'taken' } });
  });

  it('si otra persona toma el usuario justo entre medio, le agrega dígitos', async () => {
    const { auth, repo, profiles } = fakes([], { takenOnCreate: true });
    await makeSignUp({ auth, profiles: repo, now })(valid);
    expect(profiles.get('u1')?.handle).toMatch(/^ana_ica\d{4}$/);
  });

  it('deja pasar los errores de la cuenta (correo ya usado)', async () => {
    const { auth, repo } = fakes();
    await expect(makeSignUp({ auth, profiles: repo, now })({ ...valid, email: 'usado@ejemplo.com' })).rejects.toMatchObject({ code: 'email-in-use' });
  });
});
