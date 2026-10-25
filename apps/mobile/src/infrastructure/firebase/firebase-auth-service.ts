import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  verifyPasswordResetCode,
  type User,
} from '@react-native-firebase/auth';

import { AuthError, type AuthErrorCode, type AuthService, type AuthUser } from '@plumario/core';

import { firebaseErrorCode, type FirebaseServices } from './firebase-services';

// Adaptador de Firebase Auth (correo y contraseña) del puerto AuthService. Google y Apple llegan
// cuando estén configurados en la consola.

const ERROR_CODES: Record<string, AuthErrorCode> = {
  'auth/invalid-credential': 'invalid-credentials',
  'auth/wrong-password': 'invalid-credentials',
  'auth/user-not-found': 'invalid-credentials',
  'auth/user-disabled': 'invalid-credentials',
  'auth/email-already-in-use': 'email-in-use',
  'auth/weak-password': 'weak-password',
  'auth/invalid-email': 'invalid-email',
  'auth/too-many-requests': 'too-many-requests',
  'auth/network-request-failed': 'network',
  'auth/expired-action-code': 'expired-code',
  'auth/invalid-action-code': 'expired-code',
};

async function translated<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    const code = firebaseErrorCode(error);
    throw new AuthError(ERROR_CODES[code] ?? 'unknown', code || String(error));
  }
}

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email };
}

export function createFirebaseAuthService({ auth }: FirebaseServices): AuthService {
  // Una sola suscripción nativa. `current` sigue siendo el mismo objeto mientras no cambie la
  // sesión, como pide useSyncExternalStore.
  let current = auth.currentUser ? toAuthUser(auth.currentUser) : null;
  const listeners = new Set<(user: AuthUser | null) => void>();
  onAuthStateChanged(auth, (user) => {
    if ((user?.uid ?? null) === (current?.uid ?? null)) return;
    current = user ? toAuthUser(user) : null;
    for (const listener of listeners) listener(current);
  });

  return {
    currentUser: () => current,
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    signIn: (email, password) => translated(async () => toAuthUser((await signInWithEmailAndPassword(auth, email, password)).user)),
    signUp: (email, password) => translated(async () => toAuthUser((await createUserWithEmailAndPassword(auth, email, password)).user)),
    signOut: () => translated(() => signOut(auth)),
    sendPasswordReset: (email) => translated(() => sendPasswordResetEmail(auth, email)),
    verifyPasswordResetCode: (code) => translated(() => verifyPasswordResetCode(auth, code)),
    confirmPasswordReset: (code, password) => translated(() => confirmPasswordReset(auth, code, password)),
  };
}
