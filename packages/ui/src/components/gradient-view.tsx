import { useId, useState } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { Gradient } from '@plumario/tokens';

type Props = ViewProps & { gradient: Gradient };

/**
 * Fondo con un degradado de los tokens (hero, reveal, fab). Se pinta con SVG en coordenadas de la
 * caja medida, para que el ángulo y el radio salgan como en el CSS del diseño aunque la caja no
 * sea cuadrada. Hasta medirse, usa el primer color como fondo.
 */
export function GradientView({ gradient, style, children, onLayout, ...props }: Props) {
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [box, setBox] = useState({ width: 0, height: 0 });
  const { width, height } = box;
  const stops = gradient.stops.map((s) => <Stop key={s.position} offset={s.position} stopColor={s.color} />);

  let definition = null;
  if (width > 0 && height > 0) {
    if (gradient.type === 'linear') {
      // Igual que CSS: la línea pasa por el centro y mide |W·sen θ| + |H·cos θ|.
      const rad = (gradient.angle * Math.PI) / 180;
      const [dx, dy] = [Math.sin(rad), -Math.cos(rad)];
      const half = (Math.abs(width * dx) + Math.abs(height * dy)) / 2;
      const [cx, cy] = [width / 2, height / 2];
      definition = (
        <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={cx - dx * half} y1={cy - dy * half} x2={cx + dx * half} y2={cy + dy * half}>
          {stops}
        </LinearGradient>
      );
    } else {
      // «circle at x% y%» sin tamaño es farthest-corner: el radio llega a la esquina más lejana.
      const [cx, cy] = [gradient.center.x * width, gradient.center.y * height];
      const corners = [[0, 0], [width, 0], [0, height], [width, height]] as const;
      const r = Math.max(...corners.map(([x, y]) => Math.hypot(x - cx, y - cy)));
      definition = (
        <RadialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
          {stops}
        </RadialGradient>
      );
    }
  }

  return (
    <View
      {...props}
      style={[styles.box, { backgroundColor: gradient.stops[0]?.color }, style]}
      onLayout={(e) => {
        const layout = e.nativeEvent.layout;
        if (layout.width !== width || layout.height !== height) setBox({ width: layout.width, height: layout.height });
        onLayout?.(e);
      }}>
      {definition && (
        <Svg style={styles.background} width={width} height={height} pointerEvents="none">
          <Defs>{definition}</Defs>
          <Rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
        </Svg>
      )}
      {children}
    </View>
  );
}

// La caja abre su propio contexto de apilado (zIndex 0) y el degradado va al fondo (-1). Sin eso,
// en web un hijo sin posición —como el <svg> de un Icon— queda tapado por el degradado absoluto.
const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    zIndex: 0,
  },
  background: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: -1,
  },
});
