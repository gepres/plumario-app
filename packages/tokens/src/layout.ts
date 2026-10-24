// Espacio, radios y sombras de la guía (GuiaFundamentos, «Espacio y forma» y «Sombras»).

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
} as const;

/** Medidas fijas de la maqueta (pantalla de 390 × 844). */
export const layout = {
  cardMargin: 16,
  textMargin: 20,
  header: 56,
  tabBar: 104,
  /** Área táctil mínima. */
  touchTarget: 44,
  /** Alto mínimo de una fila de lista. */
  listRow: 52,
} as const;

export const radius = {
  icon: 10,
  control: 14, // botón, campo, sticker
  card: 18,
  hero: 20,
  sheet: 24,
  pill: 999,
} as const;

// Sombras en sintaxis CSS: React Native las acepta en `boxShadow` desde la 0.76 (nueva
// arquitectura). En oscuro no hay sombra de tarjeta; la barra flotante usa una negra.
export const shadows = {
  light: {
    card: '0 1px 2px rgba(30,42,27,0.16), 0 4px 10px rgba(30,42,27,0.06)',
    floating: '0 10px 22px rgba(30,42,27,0.13), 0 1px 2px rgba(30,42,27,0.08)',
    fab: '0 10px 22px rgba(62,106,43,0.35), 0 2px 4px rgba(30,42,27,0.25)',
  },
  dark: {
    card: 'none',
    floating: '0 10px 22px rgba(0,0,0,0.45)',
    fab: '0 10px 22px rgba(0,0,0,0.5)',
  },
} as const;
