import { useId, useMemo, useState } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Polygon, Rect, Stop } from 'react-native-svg';

// El destello de los acabados. Corre en el hilo de la interfaz con animaciones CSS de Reanimated: la
// carta brilla aunque el hilo de JS esté ocupado, y no despierta a React en cada vuelta.

const SWEEP_MS = 1600;
const TILT = 20;
const SWEEP_EASING = 'ease-in-out' as const;

type Props = {
  width: number;
  height: number;
  colors: readonly string[];
  /** Cada cuántos milisegundos pasa. */
  period: number;
  /** Relieve que se enciende al paso de la luz: una imagen blanca sobre transparente. */
  relief?: ImageSourcePropType;
};

const percent = (period: number) => `${((SWEEP_MS / period) * 100).toFixed(2)}%` as `${number}%`;

/**
 * Una franja inclinada cruza la carta y se queda fuera hasta la siguiente vuelta. El relieve se ve solo
 * dentro de la franja: ella lo recorta y una contra-animación lo deja quieto respecto a la carta.
 */
export function CardShine({ width, height, colors, period, relief }: Props) {
  const reduced = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  // Cada carta arranca en otro momento para que una fila no destelle a la vez.
  const [delay] = useState(() => Math.round(600 + Math.random() * 2400));
  const band = width * 0.46;
  const tall = height * 1.7;
  const top = (height - tall) / 2;
  const from = -band * 1.6;
  const to = width + band * 0.6;

  const animation = useMemo(() => {
    const end = percent(period);
    const timing = { animationDuration: period, animationDelay: delay, animationIterationCount: 'infinite' as const, animationTimingFunction: SWEEP_EASING };
    return {
      band: {
        ...timing,
        animationName: {
          '0%': { transform: [{ translateX: from }, { rotate: `${TILT}deg` }] },
          [end]: { transform: [{ translateX: to }, { rotate: `${TILT}deg` }] },
          '100%': { transform: [{ translateX: to }, { rotate: `${TILT}deg` }] },
        },
      },
      counter: {
        ...timing,
        animationName: {
          '0%': { transform: [{ rotate: `${-TILT}deg` }, { translateX: -from }] },
          [end]: { transform: [{ rotate: `${-TILT}deg` }, { translateX: -to }] },
          '100%': { transform: [{ rotate: `${-TILT}deg` }, { translateX: -to }] },
        },
      },
    };
  }, [period, delay, from, to]);

  if (reduced) return null;

  const tones = colors.length > 1 ? colors : [colors[0]!, colors[0]!];
  const stops = [
    { offset: 0, color: tones[0]!, opacity: 0 },
    ...tones.map((color, i) => ({ offset: 0.36 + (0.28 * i) / (tones.length - 1), color, opacity: 0.34 })),
    { offset: 1, color: tones[tones.length - 1]!, opacity: 0 },
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {relief && (
        <Animated.View style={[{ position: 'absolute', left: 0, top, width: band, height: tall, overflow: 'hidden' }, animation.band]}>
          <Animated.View
            style={[
              { position: 'absolute', left: 0, top: -top, width, height, transformOrigin: [band / 2, tall / 2 - top, 0] },
              animation.counter,
            ]}>
            <Image source={relief} style={{ width, height, tintColor: colors[0], opacity: 0.6 }} resizeMode="cover" />
          </Animated.View>
        </Animated.View>
      )}
      <Animated.View style={[{ position: 'absolute', left: 0, top, width: band, height: tall }, animation.band]}>
        <Svg width={band} height={tall}>
          <Defs>
            <LinearGradient id={`${uid}b`} x1="0" y1="0" x2="1" y2="0">
              {stops.map((stop) => (
                <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={band} height={tall} fill={`url(#${uid}b)`} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Estrella de cuatro puntas del diseño, en una caja de 1 × 1. */
const STAR_POINTS = '50,0 61,39 100,50 61,61 50,100 39,61 0,50 39,39';

/** Una estrellita que se enciende cuando pasa el destello. */
export function CardSparkle({ x, y, size, color, period }: { x: number; y: number; size: number; color: string; period: number }) {
  const reduced = useReducedMotion();
  const [delay] = useState(() => Math.round(600 + Math.random() * 2400));
  const animation = useMemo(() => {
    const peak = percent(period * 2);
    const end = percent(period);
    return {
      animationName: {
        '0%': { opacity: 0.5, transform: [{ scale: 0.6 }] },
        [peak]: { opacity: 1, transform: [{ scale: 1.25 }] },
        [end]: { opacity: 0.5, transform: [{ scale: 0.6 }] },
        '100%': { opacity: 0.5, transform: [{ scale: 0.6 }] },
      },
      animationDuration: period,
      animationDelay: delay,
      animationIterationCount: 'infinite' as const,
      animationTimingFunction: 'ease-in-out' as const,
    };
  }, [period, delay]);

  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y, width: size, height: size }, reduced ? { opacity: 0.7 } : animation]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Polygon points={STAR_POINTS} fill={color} />
      </Svg>
    </Animated.View>
  );
}
