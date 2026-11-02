import { useId } from 'react';
import { StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Image as SvgImage, Polygon } from 'react-native-svg';

import { textStyles } from '../theme/fonts';

// El sobre (Sobre, SobreAbrir). Se dibuja a 300 × 515 y se escala al ancho pedido. Los textos y el arte
// llegan por props: esta pieza no conoce el dominio.

export const PACK_WIDTH = 300;
export const PACK_HEIGHT = 515;

/** El corte en zigzag: la tira y el cuerpo comparten la misma línea. */
const TEETH = 24;
const tearLine = Array.from({ length: TEETH + 1 }, (_, i) => `${(i / TEETH) * PACK_WIDTH},${(PACK_HEIGHT * (i % 2 ? 9.6 : 10.8)) / 100}`);
const STRIP = `0,0 ${PACK_WIDTH},0 ${[...tearLine].reverse().join(' ')}`;
const BODY = `${tearLine.join(' ')} ${PACK_WIDTH},${PACK_HEIGHT} 0,${PACK_HEIGHT}`;

const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = cubicBezier(0.77, 0, 0.175, 1);

type Texts = {
  title: string;
  subtitle: string;
  /** La línea del pie: «1 carta de tus últimas 3 aves». */
  caption: string;
  titleColor: string;
};

type Props = Texts & {
  image: ImageSourcePropType;
  size?: number;
  /** Se corta arriba: la tira se dobla por su esquina y sale volando. */
  torn?: boolean;
  /** El cuerpo cae: la carta ya salió. */
  gone?: boolean;
  accessibilityLabel: string;
};

/** La tira se dobla primero por la esquina derecha, como al rasgarla con la mano, y después se va. */
const TEAR_OFF = {
  '0%': { transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }], opacity: 1 },
  '45%': { transform: [{ translateX: 0 }, { translateY: -6 }, { rotate: '-12deg' }], opacity: 1 },
  '100%': { transform: [{ translateX: 170 }, { translateY: -190 }, { rotate: '28deg' }], opacity: 0 },
};

function Art({ image, points }: { image: ImageSourcePropType; points: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg width={PACK_WIDTH} height={PACK_HEIGHT} viewBox={`0 0 ${PACK_WIDTH} ${PACK_HEIGHT}`} style={StyleSheet.absoluteFill}>
      <Defs>
        <ClipPath id={`${uid}c`}>
          <Polygon points={points} />
        </ClipPath>
      </Defs>
      <SvgImage href={image} x={0} y={0} width={PACK_WIDTH} height={PACK_HEIGHT} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${uid}c)`} />
    </Svg>
  );
}

export function BirdPack({ image, title, subtitle, caption, titleColor, size = PACK_WIDTH, torn = false, gone = false, accessibilityLabel }: Props) {
  const reduced = useReducedMotion();
  const k = size / PACK_WIDTH;
  // Con movimiento reducido el sobre se desvanece sin viajar.
  const strip = reduced
    ? { opacity: torn ? 0 : 1, transitionProperty: 'opacity' as const, transitionDuration: 200 }
    : {
        transformOrigin: '100% 8%',
        ...(torn ? { animationName: TEAR_OFF, animationDuration: 650, animationTimingFunction: EASE_OUT, animationFillMode: 'forwards' as const } : {}),
      };
  const body = {
    opacity: gone ? 0 : 1,
    transform: reduced || !gone ? [] : [{ translateY: 620 }],
    transitionProperty: ['transform', 'opacity'] as ('transform' | 'opacity')[],
    transitionDuration: 500,
    transitionTimingFunction: EASE_IN_OUT,
  };
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ width: size, height: (size * PACK_HEIGHT) / PACK_WIDTH }}>
      <View style={[styles.sheet, { transform: [{ scale: k }] }]}>
        <Animated.View style={[StyleSheet.absoluteFill, body]}>
          <Art image={image} points={BODY} />
          <View style={styles.logo}>
            <Text allowFontScaling={false} style={[styles.title, { color: titleColor }]}>{title}</Text>
            <Text allowFontScaling={false} style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.pill}>
            <Text allowFontScaling={false} style={styles.caption}>{caption}</Text>
          </View>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, strip]}>
          <Art image={image} points={STRIP} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: PACK_WIDTH,
    height: PACK_HEIGHT,
    transformOrigin: 'top left',
  },
  logo: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 54,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontFamily: textStyles.title.fontFamily,
    fontSize: 44,
    lineHeight: 46,
    letterSpacing: -0.9,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  subtitle: {
    fontFamily: textStyles.bodyStrong.fontFamily,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 5,
    textShadowOffset: { width: 0, height: 1 },
  },
  pill: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 58,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(247,222,142,0.6)',
    backgroundColor: 'rgba(10,14,20,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  caption: {
    fontFamily: textStyles.bodyStrong.fontFamily,
    fontSize: 11.5,
    lineHeight: 14,
    color: '#F7DE8E',
  },
});
