import type { UserId } from '../../domain/sighting';

/**
 * Puerto de salida: dónde van los errores que la app no esperaba (Crashlytics). Los cierres
 * inesperados los recoge el adaptador solo; esto es para los que se atrapan y para saber de qué
 * cuenta vienen, sin datos personales: solo el uid.
 */
export interface ErrorReporter {
  setUser(userId: UserId | null): void;
  record(error: unknown, context?: string): void;
}
