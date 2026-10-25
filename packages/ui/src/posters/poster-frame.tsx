import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { ScaledFrame } from '../components/scaled-frame';

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
  return (
    <ScaledFrame baseWidth={POSTER_WIDTH} baseHeight={POSTER_HEIGHT} width={width} style={style}>
      {children}
    </ScaledFrame>
  );
}
