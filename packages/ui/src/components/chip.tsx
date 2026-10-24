import { StyleSheet, View } from 'react-native';

import { radius } from '@plumario/tokens';

import { useTheme, type ColorToken } from '../theme/use-theme';
import { ThemedText } from './themed-text';

type Props = {
  label: string;
  /** Sobre el hero usa el fondo translúcido «heroChip» (3 medallas, 2 cromos). */
  onHero?: boolean;
  color?: ColorToken;
};

/** Pastilla para estados y conteos («Nuevo», «Amenazada», «3 medallas»). */
export function Chip({ label, onHero = false, color = 'text' }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: onHero ? colors.heroChip : colors.surfaceAlt }]}>
      <ThemedText variant="caption" style={{ color: onHero ? colors.onHero : colors[color] }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
});
