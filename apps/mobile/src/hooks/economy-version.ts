import { createVersionStore } from './version-store';

// Cuándo hay que volver a pedir saldo, sobres y repetidas: lo cambian registrar un ave, abrir un sobre,
// reciclar y comprar; lo escuchan Inicio, Recompensas y Mis repetidas.

const economy = createVersionStore();

export const invalidateEconomy = economy.invalidate;

export function useEconomyVersion(): number {
  return economy.useVersion();
}
