import type { Appearance } from '../../domain/appearance';

/**
 * Puerto de salida: la apariencia elegida, guardada en el teléfono. Es síncrono para aplicarla antes
 * del primer cuadro: si se leyera después, la app se vería un instante con el tema del teléfono.
 */
export interface AppearanceSettings {
  current(): Appearance;
  /** La guarda y la aplica a toda la app. */
  set(value: Appearance): void;
  /** Avisa cada vez que cambia; devuelve cómo dejar de escuchar. */
  subscribe(listener: (value: Appearance) => void): () => void;
}
