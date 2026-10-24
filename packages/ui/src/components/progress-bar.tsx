import { StyleSheet, View } from 'react-native';

import { spacing } from '@plumario/tokens';

import { useTheme } from '../theme/use-theme';
import { ThemedText } from './themed-text';

type Props = {
  current: number;
  total: number;
  /** Qué se mide («Litoral», «Próximo póster»). */
  label?: string;
  /** El número que se muestra y se lee en voz alta. Por omisión, «8 de 43». */
  valueText?: string;
  /** Ocultar el número visible cuando ya está al lado en grande (el hero de Inicio). */
  showValue?: boolean;
  /** Sobre el hero, la pista y el texto cambian a los colores «on hero». */
  onHero?: boolean;
};

/** Progreso del diseño: siempre con el número exacto al lado («8 de 43»), nunca solo la barra. */
export function ProgressBar({ current, total, label, valueText = `${current} de ${total}`, showValue = true, onHero = false }: Props) {
  const { colors } = useTheme();
  const ratio = total > 0 ? Math.min(current / total, 1) : 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: current, text: valueText }}
      style={styles.container}>
      {(label !== undefined || showValue) && (
        <View style={styles.header}>
          {label !== undefined && <ThemedText variant="bodyStrong" style={{ color: onHero ? colors.onHero : colors.text }}>{label}</ThemedText>}
          {showValue && (
            <ThemedText variant="caption" style={[styles.value, { color: onHero ? colors.onHeroSecondary : colors.textSecondary }]}>
              {valueText}
            </ThemedText>
          )}
        </View>
      )}
      <View style={[styles.track, { backgroundColor: onHero ? colors.heroTrack : colors.track }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: onHero ? colors.sun : colors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  value: {
    marginLeft: 'auto',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
