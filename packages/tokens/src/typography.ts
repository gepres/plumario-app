// Escala de letra de la guía (design/project/GuiaFundamentos.dc.html, sección «Letra»).
// Familia, peso y estilo van separados del nombre con que cada plataforma carga la fuente: la app
// los traduce a sus nombres de @expo-google-fonts y la web podría usarlos tal cual.

export const fontFamilies = {
  display: 'Bricolage Grotesque',
  text: 'Instrument Sans',
  serif: 'Instrument Serif',
} as const;

export type FontFamily = keyof typeof fontFamilies;
export type FontWeight = 400 | 500 | 600 | 700 | 800;

export type TypeStyle = {
  family: FontFamily;
  weight: FontWeight;
  size: number;
  /** Interlineado como múltiplo del tamaño. */
  lineHeight: number;
  /** Espaciado entre letras en em, como en el diseño. */
  tracking: number;
  italic?: boolean;
  uppercase?: boolean;
};

// Entre paréntesis, el nombre que tiene cada estilo en la guía.
export const typography = {
  sheet: { family: 'display', weight: 800, size: 40, lineHeight: 1.05, tracking: -0.02 }, // Hoja de sistema
  reveal: { family: 'display', weight: 800, size: 32, lineHeight: 1.1, tracking: -0.015 }, // Revelado
  title: { family: 'display', weight: 800, size: 27, lineHeight: 1.25, tracking: -0.02 }, // Título principal
  heading: { family: 'display', weight: 700, size: 20, lineHeight: 1.25, tracking: 0 }, // Encabezado
  section: { family: 'display', weight: 700, size: 17, lineHeight: 1.3, tracking: 0 }, // Título de sección
  button: { family: 'text', weight: 700, size: 15.5, lineHeight: 1.2, tracking: 0 }, // Botón
  body: { family: 'text', weight: 400, size: 15, lineHeight: 1.45, tracking: 0 }, // Cuerpo
  bodyStrong: { family: 'text', weight: 700, size: 15, lineHeight: 1.35, tracking: 0 }, // Cuerpo en negrita
  caption: { family: 'text', weight: 400, size: 12.5, lineHeight: 1.35, tracking: 0 }, // Ayuda
  eyebrow: { family: 'text', weight: 700, size: 12, lineHeight: 1.3, tracking: 0.1, uppercase: true }, // Antetítulo
  scientific: { family: 'serif', weight: 400, size: 20, lineHeight: 1.2, tracking: 0, italic: true }, // Nombre científico
} as const satisfies Record<string, TypeStyle>;

export type TypeVariant = keyof typeof typography;
