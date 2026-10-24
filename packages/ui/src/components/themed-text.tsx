import { Text, type TextProps } from 'react-native';

import type { TypeVariant } from '@plumario/tokens';

import { textStyles } from '../theme/fonts';
import { useTheme, type ColorToken } from '../theme/use-theme';

export type ThemedTextProps = TextProps & {
  variant?: TypeVariant;
  color?: ColorToken;
};

/** Texto con una variante de la escala de la guía y un color del tema. */
export function ThemedText({ variant = 'body', color = 'text', style, ...props }: ThemedTextProps) {
  const { colors } = useTheme();
  return <Text {...props} style={[textStyles[variant], { color: colors[color] }, style]} />;
}
