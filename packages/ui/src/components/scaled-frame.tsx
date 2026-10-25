import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  /** El tamaño con que se dibuja el contenido (el de la pieza impresa o la imagen exportada). */
  baseWidth: number;
  baseHeight: number;
  /** Ancho en puntos con que se muestra; el alto guarda la proporción. */
  width: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Marco que achica (o agranda) una pieza dibujada a tamaño fijo al ancho pedido: pósteres A3,
 * tarjetas para compartir.
 */
export function ScaledFrame({ baseWidth, baseHeight, width, children, style }: Props) {
  const k = width / baseWidth;
  return (
    <View style={[{ width, height: baseHeight * k, overflow: 'hidden' }, style]} collapsable={false}>
      <View style={{ width: baseWidth, height: baseHeight, transform: [{ scale: k }], transformOrigin: 'top left' }}>{children}</View>
    </View>
  );
}
