import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

/** Los pósteres se dibujan en 1123 × 1587 (A3 a 96 ppp) y se escalan para verlos o exportarlos. */
export const POSTER_WIDTH = 1123;
export const POSTER_HEIGHT = 1587;

type Props = {
  /** Ancho en puntos con que se muestra; el alto guarda la proporción A3. */
  width: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Marco que achica (o agranda) un póster de 1123 × 1587 al ancho pedido. */
export function PosterFrame({ width, children, style }: Props) {
  const k = width / POSTER_WIDTH;
  return (
    <View style={[{ width, height: POSTER_HEIGHT * k, overflow: 'hidden' }, style]} collapsable={false}>
      <View style={{ width: POSTER_WIDTH, height: POSTER_HEIGHT, transform: [{ scale: k }], transformOrigin: 'top left' }}>{children}</View>
    </View>
  );
}
