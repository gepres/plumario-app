import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing } from '@plumario/tokens';

import { useTheme } from '../theme/use-theme';
import { ThemedText } from './themed-text';

type Props<K extends string> = {
  label: string;
  tabs: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
};

/** Pestañas en una barra (Recompensas: «Medallas · Cromos · Pósteres»). */
export function SegmentedTabs<K extends string>({ label, tabs, value, onChange }: Props<K>) {
  const { colors, shadows } = useTheme();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={[styles.bar, { backgroundColor: colors.surfaceAlt }]}>
      {tabs.map((tab) => {
        const selected = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, selected && { backgroundColor: colors.background, boxShadow: shadows.card }]}>
            <ThemedText variant={selected ? 'label' : 'small'} color={selected ? 'text' : 'textSecondary'} style={styles.text}>
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    padding: spacing[1],
    gap: spacing[1],
    borderRadius: radius.control,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
  },
  text: {
    textAlign: 'center',
  },
});
