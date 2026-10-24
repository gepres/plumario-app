import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  InstrumentSans_400Regular,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { StyleSheet, type TextStyle } from 'react-native';

import { typography, type TypeStyle, type TypeVariant } from '@plumario/tokens';

/** Lo que la app carga con useFonts al arrancar: solo los pesos que usa la escala de la guía. */
export const fonts = {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  InstrumentSans_400Regular,
  InstrumentSans_700Bold,
  InstrumentSerif_400Regular_Italic,
};

type FontName = keyof typeof fonts;

// Con fuentes propias, cada peso es una familia distinta: no se usa fontWeight, que en Android
// elige otro archivo o sintetiza la negrita.
function fontName({ family, weight, italic }: TypeStyle): FontName {
  if (family === 'display' && weight === 800) return 'BricolageGrotesque_800ExtraBold';
  if (family === 'display' && weight === 700) return 'BricolageGrotesque_700Bold';
  if (family === 'text' && weight === 400) return 'InstrumentSans_400Regular';
  if (family === 'text' && weight === 700) return 'InstrumentSans_700Bold';
  if (family === 'serif' && weight === 400 && italic) return 'InstrumentSerif_400Regular_Italic';
  throw new Error(`No hay fuente cargada para ${family} ${weight}${italic ? ' itálica' : ''}: súmala a fonts.ts`);
}

function toTextStyle(style: TypeStyle): TextStyle {
  return {
    fontFamily: fontName(style),
    fontSize: style.size,
    lineHeight: Math.round(style.size * style.lineHeight),
    letterSpacing: style.tracking * style.size,
    ...(style.uppercase ? { textTransform: 'uppercase' } : {}),
  };
}

/** Un estilo de texto de React Native por variante de la guía. */
export const textStyles = StyleSheet.create(
  Object.fromEntries(Object.entries(typography).map(([variant, style]) => [variant, toTextStyle(style)])) as Record<TypeVariant, TextStyle>,
);
