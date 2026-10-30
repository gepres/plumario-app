import { memo, useId } from 'react';
import { View } from 'react-native';
import Svg, { ClipPath, Defs, Rect } from 'react-native-svg';

import type { FigureName } from '../figures/figure-svgs';
import { useTheme } from '../theme/use-theme';
import { BirdFigure, type BirdArt } from './bird-figure';
import { HOLOGRAPHIC } from './sticker-finishes';
import { ConicFill } from './svg-paint';

type Props = {
  figure: FigureName;
  /** Fondo del círculo cuando la tiene: el color del hábitat. */
  tint: string;
  /** Aún no la registra: borde punteado y silueta tenue. */
  empty?: boolean;
  /** Ya salió en cromo: aro holográfico. */
  chromed?: boolean;
  size?: number;
  /** El dibujo propio de la especie; sin él, la figura de su grupo. */
  art?: BirdArt;
};

/** Figurita redonda de las tarjetas de hábitat en Álbum (design/project/Album.dc.html, TemaAlbum). */
export const BirdAvatar = memo(function BirdAvatar({ figure, tint, empty = false, chromed = false, size = 36, art }: Props) {
  const { mode, colors } = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ring = chromed && !empty ? 2 : 0;
  const inner = size - ring * 2;
  return (
    <View style={{ width: size, height: size }}>
      {ring > 0 && (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
          <Defs>
            <ClipPath id={`${uid}r`}>
              <Rect x={0} y={0} width={size} height={size} rx={size / 2} />
            </ClipPath>
          </Defs>
          <ConicFill paint={HOLOGRAPHIC} box={{ x: 0, y: 0, width: size, height: size }} clipPath={`url(#${uid}r)`} />
        </Svg>
      )}
      <View
        style={{
          position: 'absolute',
          left: ring,
          top: ring,
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: empty ? 'transparent' : tint,
          borderWidth: empty ? 1.5 : 0,
          borderStyle: 'dashed',
          borderColor: colors.border,
        }}>
        <BirdFigure
          figure={figure}
          art={art}
          size={inner * (empty ? 0.82 : 0.88)}
          silhouette={empty ? (mode === 'dark' ? { color: '#FFFFFF', opacity: 0.5 } : { color: '#000000', opacity: 0.22 }) : undefined}
        />
      </View>
    </View>
  );
});
