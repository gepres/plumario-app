import { describe, expect, it } from 'vitest';

import { AuthError, type AuthService } from '../ports/auth-service';
import { makeCheckResetCode, makeRequestPasswordReset, makeResetPassword, makeSignIn } from './account-access';

// Servicio de cuentas falso con una sola cuenta y un enlace para crear contraseña.
function fakeAuth() {
  const calls: string[] = [];
  let password = 'aves2026';
  const auth: AuthService = {
    currentUser: () => null,
    onChange: () => () => {},
    signIn: async (email, pass) => {
      calls.push(`signIn ${email}`);
      if (email !== 'ana@ejemplo.com' || pass !== password) throw new AuthError('invalid-credentials');
      return { uid: 'u1', email };
    },
    signUp: async () => ({ uid: 'u2', email: null }),
    signOut: async () => {},
    sendPasswordReset: async (email) => void calls.push(`reset ${email}`),
    changeEmail: async () => {},
    deleteAccount: async () => {},
    verifyPasswordResetCode: async (code) => {
      if (code !== 'codigo') throw new AuthError('expired-code');
      return 'ana@ejemplo.com';
    },
    confirmPasswordReset: async (_code, next) => {
      password = next;
    },
  };
  return { auth, calls };
}

describe('entrar', () => {
  it('con el correo y la contraseña de la cuenta', async () => {
    const { auth } = fakeAuth();
    await expect(makeSignIn({ auth })(' ana@ejemplo.com ', 'aves2026')).resolves.toEqual({ uid: 'u1', email: 'ana@ejemplo.com' });
  });

  it('un correo mal escrito ni llega al servicio', async () => {
    const { auth, calls } = fakeAuth();
    await expect(makeSignIn({ auth })('ana@', 'aves2026')).rejects.toMatchObject({ code: 'invalid-email' });
    await expect(makeSignIn({ auth })('ana@ejemplo.com', '')).rejects.toMatchObject({ code: 'invalid-credentials' });
    expect(calls).toEqual([]);
  });
});

describe('recuperar la contraseña', () => {
  it('pide el enlace solo con un correo válido', async () => {
    const { auth, calls } = fakeAuth();
    await makeRequestPasswordReset({ auth })(' ana@ejemplo.com');
    await expect(makeRequestPasswordReset({ auth })('ana')).rejects.toMatchObject({ code: 'invalid-email' });
    expect(calls).toEqual(['reset ana@ejemplo.com']);
  });

  it('muestra de qué cuenta es el enlace, o que venció', async () => {
    const { auth } = fakeAuth();
    await expect(makeCheckResetCode({ auth })('codigo')).resolves.toBe('ana@ejemplo.com');
    await expect(makeCheckResetCode({ auth })('viejo')).rejects.toMatchObject({ code: 'expired-code' });
  });

  it('guarda la nueva y entra con ella, si cumple y las dos coinciden', async () => {
    const { auth } = fakeAuth();
    const reset = makeResetPassword({ auth });
    await expect(reset({ code: 'codigo', password: 'garza2027', repeated: 'garza2026' })).rejects.toMatchObject({ code: 'weak-password' });
    await expect(reset({ code: 'codigo', password: 'corta1', repeated: 'corta1' })).rejects.toMatchObject({ code: 'weak-password' });
    await expect(reset({ code: 'codigo', password: 'garza2027', repeated: 'garza2027' })).resolves.toMatchObject({ uid: 'u1' });
  });
});
