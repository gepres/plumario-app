export type AuthUser = { uid: string; email: string | null };

export type AuthErrorCode =
  | 'invalid-credentials'
  | 'email-in-use'
  | 'weak-password'
  | 'invalid-email'
  | 'too-many-requests'
  | 'network'
  | 'expired-code'
  | 'wrong-password'
  | 'unknown';

/** Error del servicio de autenticación, ya traducido a casos que la app sabe explicar. */
export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AuthError';
  }
}

/** Puerto de salida: el servicio de cuentas (Firebase Auth en la app, uno en memoria para la web). */
export interface AuthService {
  currentUser(): AuthUser | null;
  /** Avisa cada vez que entra o sale alguien; devuelve la función para dejar de escuchar. */
  onChange(listener: (user: AuthUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<AuthUser>;
  signUp(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  /** El correo de la cuenta del enlace para crear contraseña; AuthError «expired-code» si ya no sirve. */
  verifyPasswordResetCode(code: string): Promise<string>;
  confirmPasswordReset(code: string, newPassword: string): Promise<void>;
  /** Cambia el correo: confirma con la contraseña y manda un enlace al correo nuevo, que cambia al abrirlo. */
  changeEmail(newEmail: string, password: string): Promise<void>;
  /** Elimina la cuenta, confirmando con la contraseña; el servidor borra después sus datos. */
  deleteAccount(password: string): Promise<void>;
}
