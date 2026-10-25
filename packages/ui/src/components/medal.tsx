import { memo, useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

import { textStyles } from '../theme/fonts';
import { useTheme } from '../theme/use-theme';

// La medalla de design/project/Medalla.dc.html: cinta, aro de peltre, esmalte del color del logro
// y su marca. Bloqueada queda punteada y sin color, con el avance en un arco alrededor.

export type MedalKind = 'firstBird' | 'explorer' | 'milestone' | 'coast' | 'wetlands' | 'desert' | 'highlands' | 'openSea' | 'albumComplete';

type Props = {
  kind: MedalKind;
  /** Para «milestone»: las especies del hito (10, 20, 30…). */
  number?: number;
  /** Ancho en puntos; el alto es 1,2 veces el ancho. */
  size?: number;
  locked?: boolean;
  /** Avance hacia la medalla, de 0 a 1; solo se dibuja bloqueada. */
  progress?: number;
};

type Look = { a: string; b: string; stripe: string; enamel: readonly [string, ...string[]]; mark: string; arc: string; bronze?: boolean };

const LOOKS: Record<MedalKind, Look> = {
  firstBird: { a: '#A0541F', b: '#E7C9A0', stripe: '#F3EDE2', enamel: ['#A0541F'], mark: '#FBF3E4', arc: '#A0541F' },
  explorer: { a: '#6B5B2A', b: '#E4C766', stripe: '#F3EDE2', enamel: ['#6B5B2A'], mark: '#F3E2A6', arc: '#6B5B2A' },
  milestone: { a: '#E4C766', b: '#14302F', stripe: '#F3EDE2', enamel: ['#14302F'], mark: '#F3E2A6', arc: '#14302F' },
  coast: { a: '#2C6A86', b: '#BFD9E5', stripe: '#FFFFFF', enamel: ['#2C6A86'], mark: '#FFFFFF', arc: '#2C6A86' },
  wetlands: { a: '#3D7A55', b: '#C9E2CF', stripe: '#FFFFFF', enamel: ['#3D7A55'], mark: '#FFFFFF', arc: '#3D7A55' },
  desert: { a: '#B07A28', b: '#EAD9B5', stripe: '#FFFFFF', enamel: ['#B07A28'], mark: '#FFF6E2', arc: '#9A6A20' },
  highlands: { a: '#5D5A7A', b: '#D9D6E6', stripe: '#FFFFFF', enamel: ['#5D5A7A'], mark: '#FFFFFF', arc: '#5D5A7A' },
  openSea: { a: '#1F4E6E', b: '#B8CFE0', stripe: '#FFFFFF', enamel: ['#1F4E6E'], mark: '#FFFFFF', arc: '#1F4E6E' },
  albumComplete: { a: '#14302F', b: '#A8683A', stripe: '#E9C9A4', enamel: ['#C88B57', '#9A5C30', '#D49E6C', '#8A4F27'], mark: '#5A3216', arc: '#A8683A', bronze: true },
};

const PEWTER = ['#F2F4F5', '#A9B3B9', '#E7EAEC', '#87929A', '#D3D8DB'];
const BRONZE = ['#F0C9A0', '#A8683A', '#E2AE7C', '#7A4522', '#C78F5D'];
const RIM_STOPS = [0, 0.3, 0.52, 0.78, 1];
const ENAMEL_STOPS = [0, 0.45, 0.7, 1];

/** La marca de cada medalla, en una caja de 72 (se coloca en 62,122 de la medalla de 200 × 240). */
function Mark({ kind, color }: { kind: MedalKind; color: string }) {
  const line = { fill: 'none', stroke: color, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'firstBird':
      return <Path d="M36 48 L36 12 M36 48 L14 26 M36 48 L58 26 M36 48 L36 62" {...line} strokeWidth={5} />;
    case 'explorer':
      return (
        <G {...line} strokeWidth={4}>
          <Circle cx={22} cy={46} r={12} />
          <Circle cx={50} cy={46} r={12} />
          <Path d="M12 40 L18 18 H28 L32 36 M60 40 L54 18 H44 L40 36 M32 30 H40" />
        </G>
      );
    case 'coast':
      return (
        <G {...line} strokeWidth={4}>
          <Path d="M24 26 A12 12 0 0 1 48 26" />
          <Path d="M8 40 C14 34 20 34 26 40 C32 46 40 46 46 40 C52 34 58 34 64 40 M8 54 C14 48 20 48 26 54 C32 60 40 60 46 54 C52 48 58 48 64 54" />
        </G>
      );
    case 'wetlands':
      return (
        <G>
          <Path d="M10 62 H62 M22 62 C22 50 21 40 19 30 M36 62 V30 M50 62 C50 50 51 40 53 30" {...line} strokeWidth={3.5} />
          <Rect x={15} y={14} width={8} height={18} rx={4} fill={color} />
          <Rect x={32} y={10} width={8} height={20} rx={4} fill={color} />
          <Rect x={49} y={14} width={8} height={18} rx={4} fill={color} />
        </G>
      );
    case 'desert':
      return (
        <G {...line} strokeWidth={4}>
          <Circle cx={47} cy={22} r={8} />
          <Path d="M6 52 C18 38 30 36 40 44 C48 38 58 38 66 44 M6 62 H66" />
        </G>
      );
    case 'highlands':
      return (
        <G {...line}>
          <Path d="M6 58 L26 24 L36 38 L46 20 L66 58 Z" strokeWidth={4} />
          <Path d="M20 34 L26 24 L32 34 M40 30 L46 20 L52 30" strokeWidth={3} />
        </G>
      );
    case 'openSea':
      return (
        <G {...line} strokeWidth={4}>
          <Path d="M20 28 C26 20 32 20 36 28 C40 20 46 20 52 28" />
          <Path d="M8 48 C14 42 20 42 26 48 C32 54 40 54 46 48 C52 42 58 42 64 48 M8 60 C14 54 20 54 26 60 C32 66 40 66 46 60 C52 54 58 54 64 60" />
        </G>
      );
    case 'albumComplete':
      return (
        <G {...line}>
          <Path d="M8 22 C18 17 28 17 36 24 C44 17 54 17 64 22 V54 C54 49 44 49 36 56 C28 49 18 49 8 54 Z M36 24 V56" strokeWidth={3.5} />
          <Path d="M15 31 H28 M15 39 H28 M44 31 H57 M44 39 H57" strokeWidth={2.5} />
        </G>
      );
    case 'milestone':
      return null;
  }
}

export const Medal = memo(function Medal({ kind, number = 10, size = 200, locked = false, progress = 0 }: Props) {
  const { colors } = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const look = LOOKS[kind];
  const k = size / 200;
  const p = Math.max(0, Math.min(1, progress));
  const circumference = 2 * Math.PI * 70;
  // Bloqueada sigue la paleta (es un hueco por llenar); ganada es de metal y esmalte.
  const mark = locked ? colors.border : look.mark;

  return (
    <View style={{ width: size, height: size * 1.2 }}>
      <Svg width={size} height={size * 1.2} viewBox="0 0 200 240">
        <Defs>
          <LinearGradient id={`${uid}r`} x1="0" y1="0" x2="1" y2="1">
            {(look.bronze ? BRONZE : PEWTER).map((color, i) => <Stop key={i} offset={RIM_STOPS[i]} stopColor={color} />)}
          </LinearGradient>
          <LinearGradient id={`${uid}e`} x1="0.2" y1="0" x2="0.8" y2="1">
            {look.enamel.map((color, i) => <Stop key={i} offset={look.enamel.length > 1 ? ENAMEL_STOPS[i] : 0} stopColor={color} />)}
          </LinearGradient>
          <LinearGradient id={`${uid}s`} x1="0" y1="0.2" x2="1" y2="0.8">
            <Stop offset={0.36} stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset={0.48} stopColor="#FFFFFF" stopOpacity={0.34} />
            <Stop offset={0.6} stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Cinta */}
        <G strokeWidth={locked ? 2 : 0} stroke={locked ? colors.border : 'none'} strokeDasharray={locked ? '5 4' : undefined}>
          <Polygon points="52,0 94,0 126,104 94,112" fill={locked ? colors.surfaceAlt : look.a} />
          {!locked && <Line x1={73} y1={0} x2={110} y2={108} stroke={look.stripe} strokeWidth={4} />}
          <Polygon points="106,0 148,0 106,112 74,104" fill={locked ? colors.surfaceAlt : look.b} />
          {!locked && <Line x1={127} y1={0} x2={90} y2={108} stroke={look.stripe} strokeWidth={4} />}
        </G>

        {/* Aro, esmalte y anillo */}
        <Circle cx={100} cy={160} r={locked ? 75 : 76} fill={locked ? colors.surfaceAlt : `url(#${uid}r)`} stroke={locked ? colors.border : 'none'} strokeWidth={2} strokeDasharray={locked ? '6 4' : undefined} />
        <Circle cx={100} cy={160} r={65} fill={locked ? colors.surface : `url(#${uid}e)`} />
        <Circle
          cx={100}
          cy={160}
          r={55}
          fill="none"
          stroke={locked ? colors.line : look.bronze ? 'rgba(90,50,22,0.55)' : 'rgba(255,255,255,0.45)'}
          strokeWidth={look.bronze && !locked ? 2 : 1.5}
          strokeDasharray={look.bronze && !locked ? '1 4' : '5 4'}
          strokeLinecap={look.bronze && !locked ? 'round' : undefined}
        />

        <G transform="translate(62 122) scale(1.0556)">
          <Mark kind={kind} color={mark} />
        </G>

        {!locked && <Circle cx={100} cy={160} r={76} fill={`url(#${uid}s)`} />}

        {locked && p > 0 && (
          <G>
            <Circle cx={100} cy={160} r={70} fill="none" stroke={colors.track} strokeWidth={8} />
            <Circle
              cx={100}
              cy={160}
              r={70}
              fill="none"
              stroke={look.arc}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${(circumference * p).toFixed(1)} ${circumference.toFixed(1)}`}
              transform="rotate(-90 100 160)"
            />
          </G>
        )}
      </Svg>

      {kind === 'milestone' && (
        <View style={[styles.milestone, { left: 24 * k, top: 84 * k, width: 152 * k, height: 152 * k }]} pointerEvents="none">
          <Text style={[styles.milestoneNumber, { color: mark, fontSize: 60 * k, lineHeight: 62 * k }]}>{number}</Text>
          <Text style={[styles.milestoneLabel, { color: mark, fontSize: 12 * k, letterSpacing: 1.7 * k }]}>ESPECIES</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  milestone: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneNumber: {
    fontFamily: textStyles.reveal.fontFamily,
    letterSpacing: -1.8,
  },
  milestoneLabel: {
    fontFamily: textStyles.bodyStrong.fontFamily,
  },
});
