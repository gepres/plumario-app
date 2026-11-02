import { Pressable, StyleSheet, View } from 'react-native';

import { FeatherCoin, ThemedText, useTheme } from '@plumario/ui';

import { feathersLabel } from '@/constants/economy';

/** El saldo de plumas. Al tocarlo lleva a donde se explica cómo se ganan. */
export function FeatherBalance({ feathers, onPress }: { feathers: number; onPress?: () => void }) {
  const { colors } = useTheme();
  const chip = (
    <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <FeatherCoin size={20} />
      <ThemedText variant="label">{feathers}</ThemedText>
    </View>
  );
  if (!onPress) return <View accessible accessibilityLabel={feathersLabel(feathers)}>{chip}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${feathersLabel(feathers)}. Ver cómo se ganan`} onPress={onPress}>
      {chip}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
