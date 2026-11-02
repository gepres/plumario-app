import { StyleSheet, View } from 'react-native';

import { OBSERVATIONS_PER_PACK } from '@plumario/core';
import { ThemedText, useTheme } from '@plumario/ui';

/** «2 de 3 para tu próximo sobre», con una barra por observación. */
export function PackProgress({ observed, dark = false }: { observed: number; dark?: boolean }) {
  const { colors } = useTheme();
  const steps = Array.from({ length: OBSERVATIONS_PER_PACK }, (_, i) => i < observed);
  const label = `${observed} de ${OBSERVATIONS_PER_PACK} para tu próximo sobre`;
  return (
    <View style={styles.root} accessible accessibilityLabel={label}>
      <ThemedText variant="label" style={dark ? styles.white : undefined}>{label}</ThemedText>
      <View style={styles.steps}>
        {steps.map((done, i) => (
          <View key={i} style={[styles.step, { backgroundColor: done ? (dark ? colors.sun : colors.text) : dark ? 'rgba(243,237,226,0.16)' : colors.track }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 6,
  },
  white: {
    color: '#FFFFFF',
  },
  steps: {
    flexDirection: 'row',
    gap: 4,
  },
  step: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
});
