import { handleProblem, isEmailLike, isPasswordValid, newProfile, normalizeHandle, type HandleProblem } from '../../domain/account';
import type { AuthService, AuthUser } from '../ports/auth-service';
import { HandleTakenError, type UserProfileRepository } from '../ports/user-profile-repository';

export type SignUpInput = {
  displayName: string;
  handle: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
  ageConfirmed: boolean;
};

/** Lo que falta o está mal en el formulario de registro, campo por campo. */
export type SignUpProblems = Partial<{
  displayName: 'required';
  handle: HandleProblem | 'taken';
  email: 'invalid';
  password: 'weak';
  consent: 'required';
}>;

export class SignUpValidationError extends Error {
  constructor(readonly problems: SignUpProblems) {
    super('Datos de registro incompletos');
    this.name = 'SignUpValidationError';
  }
}

export function signUpProblems(input: SignUpInput): SignUpProblems {
  const problems: SignUpProblems = {};
  if (!input.displayName.trim()) problems.displayName = 'required';
  const handle = handleProblem(normalizeHandle(input.handle));
  if (handle) problems.handle = handle;
  if (!isEmailLike(input.email)) problems.email = 'invalid';
  if (!isPasswordValid(input.password)) problems.password = 'weak';
  if (!input.acceptedTerms || !input.ageConfirmed) problems.consent = 'required';
  return problems;
}

/**
 * Caso de uso: crear la cuenta y su perfil (Registro). Comprueba el formulario y que el @usuario esté
 * libre antes de crear la cuenta; si otra persona lo toma justo entre medio, se le agregan dígitos.
 */
export function makeSignUp(deps: { auth: AuthService; profiles: UserProfileRepository; now: () => Date }) {
  return async (input: SignUpInput): Promise<AuthUser> => {
    const problems = signUpProblems(input);
    if (Object.keys(problems).length) throw new SignUpValidationError(problems);
    const handle = normalizeHandle(input.handle);
    if (!(await deps.profiles.isHandleAvailable(handle))) throw new SignUpValidationError({ handle: 'taken' });

    const user = await deps.auth.signUp(input.email.trim(), input.password);
    const profile = newProfile({ displayName: input.displayName, handle, at: deps.now() });
    try {
      await deps.profiles.create(user.uid, profile);
    } catch (error) {
      if (!(error instanceof HandleTakenError)) throw error;
      const suffix = String(Math.floor(Math.random() * 9000) + 1000);
      await deps.profiles.create(user.uid, { ...profile, handle: `${handle.slice(0, 20)}${suffix}` });
    }
    return user;
  };
}
