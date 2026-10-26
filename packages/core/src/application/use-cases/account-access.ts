import { isEmailLike, isPasswordValid } from '../../domain/account';
import { AuthError, type AuthService, type AuthUser } from '../ports/auth-service';
import type { PushNotifications } from '../ports/push-notifications';

// Casos de uso de acceso a la cuenta (Login, OlvideContrasena, NuevaContrasena). Lo que se puede
// saber sin red —un correo mal escrito, una contraseña que no cumple— se responde antes de llamar
// al servicio, con los mismos códigos de AuthError que él.

export function makeSignIn({ auth }: { auth: AuthService }) {
  return async (email: string, password: string): Promise<AuthUser> => {
    if (!isEmailLike(email)) throw new AuthError('invalid-email');
    if (!password) throw new AuthError('invalid-credentials');
    return auth.signIn(email.trim(), password);
  };
}

/** Cerrar sesión. Antes, el teléfono deja de recibir los avisos de la cuenta: con la sesión cerrada ya no se puede. */
export function makeSignOut({ auth, push }: { auth: AuthService; push?: PushNotifications }) {
  return async (): Promise<void> => {
    const user = auth.currentUser();
    if (user && push) await push.unregister(user.uid).catch(() => undefined);
    await auth.signOut();
  };
}

export function makeRequestPasswordReset({ auth }: { auth: AuthService }) {
  return async (email: string): Promise<void> => {
    if (!isEmailLike(email)) throw new AuthError('invalid-email');
    await auth.sendPasswordReset(email.trim());
  };
}

/** El correo de la cuenta del enlace, para mostrarlo antes de pedir la contraseña nueva. */
export function makeCheckResetCode({ auth }: { auth: AuthService }) {
  return (code: string): Promise<string> => auth.verifyPasswordResetCode(code);
}

/** Guarda la contraseña nueva y entra con ella («Guardar y entrar»). */
export function makeResetPassword({ auth }: { auth: AuthService }) {
  return async (input: { code: string; password: string; repeated: string }): Promise<AuthUser> => {
    if (!isPasswordValid(input.password) || input.password !== input.repeated) throw new AuthError('weak-password');
    const email = await auth.verifyPasswordResetCode(input.code);
    await auth.confirmPasswordReset(input.code, input.password);
    return auth.signIn(email, input.password);
  };
}
