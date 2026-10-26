import type { ErrorReporter } from '@plumario/core';

/** Adaptador del puerto ErrorReporter sin Firebase (web, datos en memoria): a la consola. */
export const consoleErrorReporter: ErrorReporter = {
  setUser: () => undefined,
  record: (error, context) => console.warn(context ?? 'Error', error),
};
