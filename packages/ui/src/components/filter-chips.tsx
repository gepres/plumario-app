import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing } from '@plumario/tokens';

import { useTheme } from '../theme/use-theme';
import { ThemedText } from './themed-text';

type Option<K extends string> = { key: K; label: string };

type Props<K extends string> = {
  label: string;
  options: readonly Option<K>[];
  value: K;
  onChange: (key: K) => void;
};

/** Filtros en píldora, uno elegido a la vez («Todas · 43», «Tengo · 8», «Me faltan · 35»). */
export function FilterChips<K extends string>({ label, options, value, onChange }: Props<K>) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.key)}
            style={[
              styles.chip,
              selected ? { backgroundColor: colors.text, borderColor: colors.text } : { backgroundColor: 'transparent', borderColor: colors.border },
            ]}>
            <ThemedText variant="label" style={{ color: selected ? colors.background : colors.text }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing[4],
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
});
