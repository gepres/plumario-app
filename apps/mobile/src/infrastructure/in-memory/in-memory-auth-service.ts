import { AuthError, type AuthService, type AuthUser } from '@plumario/core';

type Account = { uid: string; email: string; password: string };

/**
 * Adaptador en memoria del puerto AuthService, para la vista web y las pruebas. Arranca sin sesión
 * y con la cuenta de muestra del diseño (coleccionista@ejemplo.com · aves2026). El «correo» para
 * crear contraseña no se envía: el código queda en `lastResetCode`.
 */
export class InMemoryAuthService implements AuthService {
  static readonly SAMPLE_ACCOUNT = { email: 'coleccionista@ejemplo.com', password: 'aves2026' };

  lastResetCode: string | null = null;
  private readonly accounts = new Map<string, Account>();
  private readonly resetCodes = new Map<string, string>();
  private readonly listeners = new Set<(user: AuthUser | null) => void>();
  private current: AuthUser | null = null;
  private nextId = 1;

  constructor(accounts: { email: string; password: string }[] = [InMemoryAuthService.SAMPLE_ACCOUNT]) {
    for (const { email, password } of accounts) this.addAccount(email, password);
  }

  currentUser = () => this.current;

  onChange = (listener: (user: AuthUser | null) => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  async signIn(email: string, password: string): Promise<AuthUser> {
    const account = this.accounts.get(email.toLowerCase());
    if (!account || account.password !== password) throw new AuthError('invalid-credentials');
    return this.setCurrent(account);
  }

  async signUp(email: string, password: string): Promise<AuthUser> {
    if (this.accounts.has(email.toLowerCase())) throw new AuthError('email-in-use');
    return this.setCurrent(this.addAccount(email, password));
  }

  async signOut(): Promise<void> {
    this.current = null;
    this.notify();
  }

  async sendPasswordReset(email: string): Promise<void> {
    // Como Firebase: no dice si el correo tiene cuenta, para no revelar quién está registrado.
    if (!this.accounts.has(email.toLowerCase())) return;
    const code = `reset-${this.nextId++}`;
    this.resetCodes.set(code, email.toLowerCase());
    this.lastResetCode = code;
  }

  async verifyPasswordResetCode(code: string): Promise<string> {
    const email = this.resetCodes.get(code);
    if (!email) throw new AuthError('expired-code');
    return email;
  }

  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    const account = this.accounts.get(await this.verifyPasswordResetCode(code));
    if (!account) throw new AuthError('expired-code');
    account.password = newPassword;
    this.resetCodes.delete(code);
  }

  private addAccount(email: string, password: string): Account {
    const account = { uid: `local-${this.nextId++}`, email: email.toLowerCase(), password };
    this.accounts.set(account.email, account);
    return account;
  }

  private setCurrent(account: Account): AuthUser {
    this.current = { uid: account.uid, email: account.email };
    this.notify();
    return this.current;
  }

  private notify() {
    for (const listener of this.listeners) listener(this.current);
  }
}
