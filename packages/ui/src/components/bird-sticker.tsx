import { Fragment, memo, useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Pattern, Polygon, Rect } from 'react-native-svg';

import type { FigureName } from '../figures/figure-svgs';
import { textStyles } from '../theme/fonts';
import { useTheme } from '../theme/use-theme';
import { BirdFigure } from './bird-figure';
import { FINISHES, type ChromeFinish } from './sticker-finishes';
import { ConicFill, paintDefinition, paintFill, type Paint } from './svg-paint';

// El sticker de una especie (design/project/StickerAve.dc.html) en sus tres estados
// (SistemaStickers): normal al completarlo, cromado con el acabado de su categoría, y en sombra
// mientras no se registra. Tamaños de uso: 108 en el álbum, 72 en listas, 40 en tablas.

export type StickerFinish = 'normal' | ChromeFinish;

type Props = {
  figure: FigureName;
  name: string;
  /** El número impreso: «011». */
  number: string;
  /** Color de la placa de la figura: el del hábitat de la especie. */
  tint: string;
  finish?: StickerFinish;
  /** En sombra: la especie aún no está en el álbum. */
  empty?: boolean;
  /** Ancho en puntos; el alto guarda la proporción 160 × 205. */
  size?: number;
};

const W = 160;
const H = 205;
const NORMAL_SHADOW = '0 1px 2px rgba(20,48,47,0.2), 0 4px 10px rgba(20,48,47,0.08)';
const CARD = { x: 0, y: 0, width: W, height: H };
const PLATE = { x: 0, y: 0, width: 146, height: 146 };

/** Una capa de pintura sobre un rectángulo redondeado; los cónicos se recortan con `clipId`. */
function Layer({ id, paint, box, radius, clipId, opacity }: { id: string; paint: Paint; box: typeof CARD; radius: number; clipId: string; opacity?: number }) {
  if (paint.type === 'conic') return <ConicFill paint={paint} box={box} clipPath={`url(#${clipId})`} opacity={opacity} />;
  return <Rect x={box.x} y={box.y} width={box.width} height={box.height} rx={radius} fill={paintFill(id, paint) ?? 'none'} opacity={opacity} />;
}

/** Estrella de cuatro puntas del diseño (clip-path de StickerAve), en su caja. */
function starPoints(cx: number, cy: number, size: number) {
  const l = cx - size / 2;
  const t = cy - size / 2;
  const p = (x: number, y: number) => `${(l + x * size).toFixed(2)},${(t + y * size).toFixed(2)}`;
  return [p(0.5, 0), p(0.61, 0.39), p(1, 0.5), p(0.61, 0.61), p(0.5, 1), p(0.39, 0.61), p(0, 0.5), p(0.39, 0.39)].join(' ');
}

export const BirdSticker = memo(function BirdSticker({ figure, name, number, tint, finish = 'normal', empty = false, size = 108 }: Props) {
  const { mode, colors } = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const k = size / W;
  const chrome = !empty && finish !== 'normal' ? FINISHES[finish] : null;

  // En sombra el sticker sigue la paleta (es un hueco del álbum); normal y cromado son de material.
  const nameColor = empty ? colors.textSecondary : (chrome?.name ?? '#14302F');
  const numberStyle = empty
    ? { color: colors.textSecondary, backgroundColor: mode === 'dark' ? colors.surfaceAlt : 'rgba(255,255,255,0.75)' }
    : { color: chrome?.number.color ?? '#14302F', backgroundColor: chrome?.number.background ?? '#FFFFFF' };

  return (
    <View style={{ width: size, height: (size * H) / W }}>
      <View
        style={[
          styles.fill,
          { borderRadius: 14 * k },
          empty
            ? { backgroundColor: colors.surface, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border }
            : { backgroundColor: chrome ? 'transparent' : '#FFFFFF', boxShadow: chrome?.cardShadow ?? NORMAL_SHADOW },
        ]}
      />

      {chrome && (
        <Svg style={styles.fill} width={size} height={(size * H) / W} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <ClipPath id={`${uid}k`}>
              <Rect x={0} y={0} width={W} height={H} rx={14} />
            </ClipPath>
            {paintDefinition(`${uid}c`, chrome.card, CARD)}
            {chrome.holo && chrome.holo !== 'stripes' && paintDefinition(`${uid}h`, chrome.holo, CARD)}
            {chrome.holo === 'stripes' && (
              // El cepillado de la plata: una raya clara y una oscura de 1 unidad.
              <Pattern id={`${uid}s`} patternUnits="userSpaceOnUse" x={0} y={0} width={2} height={H}>
                <Rect x={0} y={0} width={1} height={H} fill="rgba(255,255,255,0.12)" />
                <Rect x={1} y={0} width={1} height={H} fill="rgba(30,40,48,0.05)" />
              </Pattern>
            )}
          </Defs>
          <Layer id={`${uid}c`} paint={chrome.card} box={CARD} radius={14} clipId={`${uid}k`} />
          {chrome.holo === 'stripes' ? (
            <Rect x={0} y={0} width={W} height={H} rx={14} fill={`url(#${uid}s)`} />
          ) : (
            chrome.holo && <Layer id={`${uid}h`} paint={chrome.holo} box={CARD} radius={14} clipId={`${uid}k`} />
          )}
          <Rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={13.5} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={1} />
          {chrome.frame && (
            <G fill="none">
              <Rect x={3 + chrome.frame.width / 2} y={3 + chrome.frame.width / 2} width={154 - chrome.frame.width} height={199 - chrome.frame.width} rx={11 - chrome.frame.width / 2} stroke={chrome.frame.stroke} strokeWidth={chrome.frame.width} />
              {chrome.frame.inner && <Rect x={4.5} y={4.5} width={151} height={196} rx={9.5} stroke={chrome.frame.inner} strokeWidth={1} />}
            </G>
          )}
        </Svg>
      )}

      <View style={[styles.plate, { left: 7 * k, top: 7 * k, width: 146 * k, height: 146 * k, borderRadius: 10 * k, backgroundColor: empty ? colors.surfaceAlt : tint }]}>
        <BirdFigure
          figure={figure}
          size={136 * k}
          style={{ position: 'absolute', left: 5 * k, top: 5 * k }}
          silhouette={empty ? (mode === 'dark' ? { color: '#FFFFFF', opacity: 0.3 } : { color: '#000000', opacity: 0.17 }) : undefined}
        />
        {chrome && (
          <Svg style={styles.fill} width={146 * k} height={146 * k} viewBox="0 0 146 146">
            <Defs>
              <ClipPath id={`${uid}p`}>
                <Rect x={0} y={0} width={146} height={146} rx={10} />
              </ClipPath>
              {chrome.sheen.map((paint, i) => (
                <Fragment key={i}>{paintDefinition(`${uid}s${i}`, paint, PLATE)}</Fragment>
              ))}
            </Defs>
            {chrome.sheen.map((paint, i) => (
              <Layer key={i} id={`${uid}s${i}`} paint={paint} box={PLATE} radius={10} clipId={`${uid}p`} />
            ))}
          </Svg>
        )}
        <Text
          style={[
            styles.number,
            numberStyle,
            { left: 6 * k, top: 6 * k, fontSize: 11 * k, lineHeight: 14 * k, paddingHorizontal: 7 * k, paddingVertical: 1 * k, borderRadius: 999 },
          ]}>
          {number}
        </Text>
      </View>

      <View style={[styles.nameBox, { left: 8 * k, top: 156 * k, width: 144 * k, height: 44 * k }]}>
        <Text
          numberOfLines={2}
          style={[
            styles.name,
            { color: nameColor, fontSize: 13 * k, lineHeight: 15 * k },
            chrome?.nameShadow && { textShadowColor: chrome.nameShadow, textShadowOffset: { width: 0, height: k }, textShadowRadius: k },
          ]}>
          {name}
        </Text>
      </View>

      {chrome && (
        <>
          <Svg style={styles.fill} width={size} height={(size * H) / W} viewBox={`0 0 ${W} ${H}`} pointerEvents="none">
            {chrome.stars.map((s, i) => (
              <Polygon key={i} points={starPoints(s.cx, s.cy, s.size)} fill={s.color} />
            ))}
          </Svg>
          <View
            style={[
              styles.badge,
              {
                left: 124 * k,
                top: -6 * k,
                width: 42 * k,
                height: 42 * k,
                borderRadius: 21 * k,
                borderWidth: Math.max(1, 3 * k),
                borderColor: chrome.badge.border,
                boxShadow: chrome.badge.shadow,
              },
            ]}>
            <Svg width="100%" height="100%" viewBox="0 0 36 36">
              <Defs>
                <ClipPath id={`${uid}b`}>
                  <Rect x={0} y={0} width={36} height={36} rx={18} />
                </ClipPath>
                {paintDefinition(`${uid}g`, chrome.badge.background, { x: 0, y: 0, width: 36, height: 36 })}
              </Defs>
              <Layer id={`${uid}g`} paint={chrome.badge.background} box={{ x: 0, y: 0, width: 36, height: 36 }} radius={18} clipId={`${uid}b`} />
              <G transform="translate(9 9) scale(0.75)">
                <Path d={chrome.badge.icon} fill={chrome.badge.iconFill} fillRule="evenodd" />
                {chrome.badge.icon2 && <Path d={chrome.badge.icon2} fill={chrome.badge.icon2Fill} />}
              </G>
            </Svg>
          </View>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  plate: {
    position: 'absolute',
    overflow: 'hidden',
  },
  number: {
    position: 'absolute',
    overflow: 'hidden',
    fontFamily: textStyles.bodyStrong.fontFamily,
  },
  // El nombre ocupa todo el ancho de su caja: centrado por ancho intrínseco, Android a veces lo mide
  // con el ancho de una palabra y pierde la segunda línea.
  nameBox: {
    position: 'absolute',
    justifyContent: 'center',
  },
  name: {
    width: '100%',
    fontFamily: textStyles.bodyStrong.fontFamily,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
