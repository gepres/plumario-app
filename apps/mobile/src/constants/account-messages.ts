import { AuthError, SignUpValidationError, type AuthErrorCode, type SignUpProblems } from '@plumario/core';

// Lo que se le dice a la persona en las pantallas de cuenta, por cada caso que el núcleo distingue.

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  'invalid-credentials': 'El correo o la contraseña no coinciden.',
  'email-in-use': 'Ya hay una cuenta con este correo. Inicia sesión o recupera tu contraseña.',
  'weak-password': 'Mínimo 8 caracteres, con una letra y un número.',
  'invalid-email': 'Escribe un correo válido, como nombre@ejemplo.com.',
  'too-many-requests': 'Hubo demasiados intentos. Espera unos minutos y vuelve a probar.',
  network: 'No hay conexión. Revisa tu señal y vuelve a intentar.',
  'expired-code': 'El enlace venció o ya se usó. Pide uno nuevo.',
  unknown: 'Algo salió mal. Vuelve a intentar.',
};

type SignUpField = keyof SignUpProblems;

const SIGN_UP_MESSAGES: { [K in SignUpField]-?: Record<NonNullable<SignUpProblems[K]>, string> } = {
  displayName: { required: 'Escribe tu nombre.' },
  handle: {
    'too-short': 'Mínimo 3 caracteres.',
    'too-long': 'Máximo 24 caracteres.',
    'invalid-characters': 'Solo minúsculas, números, «_» y «.».',
    taken: 'Ese usuario ya existe. Prueba con otro.',
  },
  email: { invalid: AUTH_ERROR_MESSAGES['invalid-email'] },
  password: { weak: AUTH_ERROR_MESSAGES['weak-password'] },
  consent: { required: 'Marca las dos casillas para crear tu cuenta.' },
};

/** Error de cada campo de Registro y, aparte, el que no es de un campo (sin red, demasiados intentos). */
export type SignUpErrors = Partial<Record<SignUpField | 'form', string>>;

export function signUpErrors(error: unknown): SignUpErrors {
  if (error instanceof SignUpValidationError) {
    const errors: SignUpErrors = {};
    for (const [field, problem] of Object.entries(error.problems) as [SignUpField, string][]) {
      errors[field] = (SIGN_UP_MESSAGES[field] as Record<string, string>)[problem];
    }
    return errors;
  }
  if (error instanceof AuthError) {
    if (error.code === 'email-in-use' || error.code === 'invalid-email') return { email: AUTH_ERROR_MESSAGES[error.code] };
    if (error.code === 'weak-password') return { password: AUTH_ERROR_MESSAGES[error.code] };
    return { form: AUTH_ERROR_MESSAGES[error.code] };
  }
  return { form: AUTH_ERROR_MESSAGES.unknown };
}

export function authErrorCode(error: unknown): AuthErrorCode {
  return error instanceof AuthError ? error.code : 'unknown';
}
