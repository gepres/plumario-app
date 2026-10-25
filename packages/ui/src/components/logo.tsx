import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';

type Props = {
  /** «mark»: solo la tarjeta, sobre otro fondo (el hero de Login). «icon»: cuadrado con fondo. */
  variant?: 'mark' | 'icon';
  /** Alto en puntos. */
  size?: number;
};

/**
 * El logo de design/project/TemaLogo.dc.html: tarjeta-cromo girada, ave a trazo y sello con
 * estrella, con los colores logo* de la paleta.
 */
export function Logo({ variant = 'mark', size = 76 }: Props) {
  const { colors } = useTheme();
  const isIcon = variant === 'icon';
  const markHeight = isIcon ? Math.round(size * 0.8) : size;
  const mark = (
    <Svg width={Math.round((markHeight * 360) / 412)} height={markHeight} viewBox="78 58 360 412">
      <G transform="rotate(-6 256 262)">
        <Path d="M140 86 H372 A40 40 0 0 1 412 126 V370 L338 444 H140 A40 40 0 0 1 100 404 V126 A40 40 0 0 1 140 86 Z" fill={colors.logoCard} />
        <Path d="M412 370 L338 444 C 346 408 368 380 412 370 Z" fill={colors.logoFold} />
        <G fill="none" stroke={colors.logoStroke} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" transform="translate(91 86) scale(1.06)">
          <Path d="M156 28 L156 98" />
          <Circle cx={156} cy={117} r={18} />
          <Path d="M156 136 C 136 146 132 186 140 216 C 146 236 166 236 172 216 C 180 186 176 146 156 136 Z" />
          <Path d="M140 160 L 30 146 L 37 172 L 60 167 L 63 188 L 88 181 L 92 200 L 140 192" />
          <Path d="M172 160 L 282 146 L 275 172 L 252 167 L 249 188 L 224 181 L 220 200 L 172 192" />
          <Path d="M144 230 L 128 290 L 146 283 L 156 302 L 166 283 L 184 290 L 168 230" />
        </G>
        <Circle cx={362} cy={134} r={30} fill={colors.logoSeal} stroke={colors.logoCard} strokeWidth={7} />
        <Path d="M362 114l5.9 13.2 14.4 1.3-10.9 9.6 3.2 14.1-12.6-7.4-12.6 7.4 3.2-14.1-10.9-9.6 14.4-1.3z" fill={colors.logoStar} />
      </G>
    </Svg>
  );
  if (!isIcon) return <View accessible={false}>{mark}</View>;
  return (
    <View
      accessible={false}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.225), backgroundColor: colors.logoTile, alignItems: 'center', justifyContent: 'center' }}>
      {mark}
    </View>
  );
}
