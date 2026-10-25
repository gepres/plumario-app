import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { ThemedText } from './themed-text';

type Props = {
  label: string;
  /** Una línea debajo de la etiqueta («Junto a la figura del ave»). */
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

/** Interruptor con su etiqueta a la izquierda (PosterVista: «Usar mis fotos»). */
export function Switch({ label, description, value, onChange, disabled = false }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={[styles.row, disabled && styles.off]}>
      <View style={styles.label}>
        <ThemedText variant="bodyStrong">{label}</ThemedText>
        {description && <ThemedText variant="caption" color="textSecondary">{description}</ThemedText>}
      </View>
      <View style={[styles.track, { backgroundColor: value ? colors.text : colors.border }]}>
        {/* Encendido, la perilla toma el fondo: en modo oscuro la pista es clara y una perilla blanca se perdería. */}
        <View style={[styles.knob, value ? { left: 23, backgroundColor: colors.background } : { left: 3 }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  off: {
    opacity: 0.5,
  },
  label: {
    flex: 1,
    gap: 1,
  },
  track: {
    width: 52,
    height: 32,
    borderRadius: 999,
  },
  knob: {
    position: 'absolute',
    top: 3,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
  },
});
