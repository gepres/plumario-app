import type { ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';

// Esqueleto de carga: la forma de la pantalla en bloques grises mientras llegan los datos, para que
// no salte al aparecer. Todo el grupo late con un solo valor (una animación CSS de Reanimated, en el
// hilo de la UI); con «reducir movimiento», queda quieto.

const PULSE = { from: { opacity: 1 }, to: { opacity: 0.5 } };

type GroupProps = {
  /** Lo que dice el lector de pantalla, una sola vez para todo el grupo. */
  label?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Un grupo de bloques que se está cargando. */
export function Skeleton({ label = 'Cargando…', children, style }: GroupProps) {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={[
        style,
        !reduced && {
          animationName: PULSE,
          animationDuration: '900ms',
          animationIterationCount: 'infinite',
          animationDirection: 'alternate',
          animationTimingFunction: 'ease-in-out',
        },
      ]}>
      <View importantForAccessibility="no-hide-descendants" style={styles.contents}>
        {children}
      </View>
    </Animated.View>
  );
}

type BlockProps = {
  width?: DimensionValue;
  /** Sin alto, lo da el estilo (por ejemplo, aspectRatio). */
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Un bloque del esqueleto: un texto, una foto, una tarjeta. */
export function SkeletonBlock({ width = '100%', height, radius = 12, style }: BlockProps) {
  const { colors } = useTheme();
  return <View style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceAlt }, style]} />;
}

/** Una fila de stickers del álbum en espera: tarjeta con la figura y el nombre. */
export function SkeletonStickers({ count = 3, columns = 3 }: { count?: number; columns?: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.sticker, { width: `${(100 - (columns - 1) * 3) / columns}%`, backgroundColor: colors.surface, borderColor: colors.line }]}>
          <SkeletonBlock radius={10} style={styles.figure} />
          <SkeletonBlock width="70%" height={10} radius={5} style={styles.center} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contents: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: '3%',
    rowGap: 12,
  },
  sticker: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 6,
    paddingBottom: 12,
    gap: 10,
  },
  figure: {
    aspectRatio: 1,
  },
  center: {
    alignSelf: 'center',
  },
});
