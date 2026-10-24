import { StyleSheet, View, type ViewProps } from 'react-native';

import { radius, spacing } from '@plumario/tokens';

import { useTheme } from '../theme/use-theme';

/** Tarjeta del diseño: superficie con borde de línea y la sombra de tarjeta del modo. */
export function Card({ style, ...props }: ViewProps) {
  const { colors, shadows } = useTheme();
  return (
    <View
      {...props}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, boxShadow: shadows.card }, style]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing[4],
    gap: spacing[2],
  },
});
