import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@plumario/tokens';

import { useTheme } from '../theme/use-theme';
import { ThemedText } from './themed-text';

type Props<K extends string> = {
  label: string;
  options: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
};

/** Selector compacto de una opción (PosterGenerar: «Fondo · Claro · Oscuro»). */
export function ToggleGroup<K extends string>({ label, options, value, onChange }: Props<K>) {
  const { colors, shadows } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.group, { backgroundColor: colors.surfaceAlt }]}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.key)}
            style={[styles.option, selected && { backgroundColor: colors.background, boxShadow: shadows.card }]}>
            <ThemedText variant="label" color={selected ? 'text' : 'textSecondary'}>{option.label}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
    borderRadius: 12,
  },
  option: {
    minHeight: 38,
    paddingHorizontal: spacing[3],
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
