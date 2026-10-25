import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { BirdSticker, type StickerFinish } from '../components/bird-sticker';
import type { FigureName } from '../figures/figure-svgs';
import { textStyles } from '../theme/fonts';
import { POSTER_HEIGHT, POSTER_WIDTH } from './poster-frame';

// El póster de cada 10 especies (design/project/Poster10.dc.html): 10 stickers girados sobre papel
// punteado, con el sello del número. Es de papel: claro u oscuro según se elija, no según el modo.

export type PosterSticker = { figure: FigureName; name: string; number: string; tint: string; finish: StickerFinish };

type Props = {
  theme: 'light' | 'dark';
  number: number;
  title: string;
  subtitle: string;
  /** Debajo del número en el sello («10 especies», «en camino»). */
  meta: string;
  footer: string;
  collector: string;
  /** null mientras el póster está en camino: huecos con «?» y el avance al centro. */
  stickers: readonly PosterSticker[] | null;
  progress?: string;
};

const THEMES = {
  light: {
    paper: '#F3EDE2', dot: 'rgba(20,48,47,0.09)', ink: '#14302F', ink2: '#4E5E5C', accent: '#2C6A86',
    sealBg: '#14302F', sealInk: '#F3EDE2', sealRing: '0 0 0 6px #F3EDE2, 0 0 0 8px #14302F',
    emptyBorder: '#B9AE99', emptyBg: 'rgba(251,248,242,0.55)', emptyInk: '#C9BEA9', circle: '#FBF8F2',
  },
  dark: {
    paper: '#11292A', dot: 'rgba(243,237,226,0.08)', ink: '#F3EDE2', ink2: '#B9C9C6', accent: '#E4C766',
    sealBg: '#F3EDE2', sealInk: '#14302F', sealRing: '0 0 0 6px #11292A, 0 0 0 8px #F3EDE2',
    emptyBorder: '#4E6664', emptyBg: 'rgba(243,237,226,0.05)', emptyInk: '#4E6664', circle: '#173634',
  },
} as const;

/** Dónde va cada uno de los 10 stickers, con su ancho y su giro (área de 979 × 1080). */
const SLOTS = [
  { x: 20, y: 0, w: 270, rot: -5 },
  { x: 345, y: 30, w: 250, rot: 3 },
  { x: 650, y: 0, w: 290, rot: -3 },
  { x: 0, y: 380, w: 220, rot: 4 },
  { x: 245, y: 400, w: 230, rot: -6 },
  { x: 500, y: 385, w: 220, rot: 5 },
  { x: 745, y: 400, w: 225, rot: -4 },
  { x: 40, y: 700, w: 280, rot: 3 },
  { x: 360, y: 720, w: 260, rot: -4 },
  { x: 660, y: 690, w: 290, rot: 5 },
] as const;

export function SpeciesPoster({ theme, number, title, subtitle, meta, footer, collector, stickers, progress }: Props) {
  const t = THEMES[theme];
  return (
    <View style={[styles.paper, { backgroundColor: t.paper }]}>
      <Svg style={styles.fill} width={POSTER_WIDTH} height={POSTER_HEIGHT}>
        <Defs>
          <Pattern id="dots" patternUnits="userSpaceOnUse" width={28} height={28}>
            <Circle cx={14} cy={14} r={1.5} fill={t.dot} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={POSTER_WIDTH} height={POSTER_HEIGHT} fill="url(#dots)" />
      </Svg>

      <View style={styles.header}>
        <View style={styles.titles}>
          <Text style={[styles.eyebrow, { color: t.accent }]}>ÁLBUM AVES DE ICA · EDICIÓN INICIAL</Text>
          <Text style={[styles.title, { color: t.ink }]} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
          <Text style={[styles.subtitle, { color: t.ink2 }]}>{subtitle}</Text>
        </View>
        <View style={[styles.seal, { backgroundColor: t.sealBg, boxShadow: t.sealRing }]}>
          <Text style={[styles.sealLabel, { color: t.sealInk }]}>PÓSTER</Text>
          <Text style={styles.sealNumber}>{number}</Text>
          <Text style={[styles.sealMeta, { color: t.sealInk }]}>{meta}</Text>
        </View>
      </View>

      <View style={styles.stage}>
        {SLOTS.map((slot, i) => {
          const sticker = stickers?.[i];
          const height = Math.round((slot.w * 205) / 160);
          return (
            <View key={i} style={{ position: 'absolute', left: slot.x, top: slot.y, transform: [{ rotate: `${slot.rot}deg` }] }}>
              {sticker ? (
                <BirdSticker figure={sticker.figure} name={sticker.name} number={sticker.number} tint={sticker.tint} finish={sticker.finish} size={slot.w} />
              ) : (
                <View style={[styles.empty, { width: slot.w, height, borderColor: t.emptyBorder, backgroundColor: t.emptyBg }]}>
                  <Text style={[styles.emptyMark, { color: t.emptyInk }]}>?</Text>
                </View>
              )}
            </View>
          );
        })}
        {!stickers && progress && (
          <View style={[styles.progress, { backgroundColor: t.circle, borderColor: t.ink }]}>
            <Text style={[styles.progressNumber, { color: t.ink }]}>{progress}</Text>
            <Text style={[styles.progressLabel, { color: t.ink2 }]}>ESPECIES</Text>
          </View>
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: t.ink }]}>
        <Text style={[styles.footerText, styles.collector, { color: t.ink }]}>{collector}</Text>
        <Text style={[styles.footerText, { color: t.ink2 }]}>{footer}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  paper: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    padding: 72,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 32,
  },
  titles: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  eyebrow: {
    fontFamily: textStyles.bodyStrong.fontFamily,
    fontSize: 16,
    letterSpacing: 2.2,
  },
  title: {
    fontFamily: textStyles.title.fontFamily,
    fontSize: 90,
    lineHeight: 94,
    letterSpacing: -2.2,
  },
  subtitle: {
    fontFamily: textStyles.scientific.fontFamily,
    fontSize: 30,
    lineHeight: 36,
  },
  seal: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealLabel: {
    fontFamily: textStyles.bodyStrong.fontFamily,
    fontSize: 13,
    letterSpacing: 2,
  },
  sealNumber: {
    fontFamily: textStyles.title.fontFamily,
    fontSize: 62,
    lineHeight: 66,
    color: '#E4C766',
  },
  sealMeta: {
    fontFamily: textStyles.bodyStrong.fontFamily,
    fontSize: 13,
  },
  stage: {
    width: 979,
    height: 1080,
  },
  empty: {
    borderRadius: 18,
    borderWidth: 3,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMark: {
    fontFamily: textStyles.title.fontFamily,
    fontSize: 72,
  },
  progress: {
    position: 'absolute',
    left: 359,
    top: 410,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 12px 30px rgba(20,48,47,0.18)',
  },
  progressNumber: {
    fontFamily: textStyles.title.fontFamily,
    fontSize: 76,
    lineHeight: 80,
    letterSpacing: -2.2,
  },
  progressLabel: {
    fontFamily: textStyles.bodyStrong.fontFamily,
    fontSize: 18,
    letterSpacing: 2.2,
  },
  footer: {
    borderTopWidth: 2,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
  },
  footerText: {
    fontFamily: textStyles.body.fontFamily,
    fontSize: 16,
  },
  collector: {
    fontFamily: textStyles.bodyStrong.fontFamily,
  },
});
