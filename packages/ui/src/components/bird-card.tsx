import { useId, type ReactNode } from 'react';
import { Image, StyleSheet, Text, View, type GestureResponderEvent, type ImageSourcePropType, type TextStyle } from 'react-native';
import Animated, { cubicBezier, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { FigureName } from '../figures/figure-svgs';
import { textStyles } from '../theme/fonts';
import { BirdFigure, type BirdArt } from './bird-figure';
import type { StickerFinish } from './bird-sticker';
import { CARD_FACES, HABITAT_ICONS, HABITAT_INKS, SCENE_FOCUS, type CardFace, type CardHabitat } from './card-faces';
import { CardShine, CardSparkle } from './card-shine';

// La carta de una especie (Cartas Plumario, V2Carta y V2Reverso). Se dibuja a 300 × 420 y se escala al
// ancho pedido. Los textos y las imágenes llegan por props: esta pieza no conoce el dominio.

export const CARD_WIDTH = 300;
export const CARD_HEIGHT = 420;

export type CardSeal = { image: ImageSourcePropType; label: string };
export type CardTrait = { title: string; text: string };
export type CardFact = { label: string; value: string };

type FrontProps = {
  finish: StickerFinish;
  habitat: CardHabitat;
  habitatLabel: string;
  name: string;
  scientificName: string;
  observations: number;
  /** La cinta bajo el arte: «Pelícanos · 3,4 kg · ala 62 cm». */
  ribbon: string;
  traits: readonly CardTrait[];
  facts: readonly CardFact[];
  seals: readonly CardSeal[];
  /** Pie de la carta: «Ica 230/294». */
  collection: string;
  finishLabel: string;
  figure: FigureName;
  art?: BirdArt;
  frame: ImageSourcePropType;
  scene: ImageSourcePropType;
  /** Relieve que enciende el destello. */
  relief?: ImageSourcePropType;
  size?: number;
  /** Quieta cuando otra pieza ya la inclina. */
  still?: boolean;
  accessibilityLabel?: string;
};

const FONT = {
  display: textStyles.title.fontFamily,
  bold: textStyles.bodyStrong.fontFamily,
  regular: textStyles.body.fontFamily,
  serif: textStyles.scientific.fontFamily,
};
const PLATE_SHADOW = '0 2px 5px rgba(0,0,0,0.28)';
const CARD_SHADOW = '0 1px 2px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.26)';
const PRISM = ['#F4C6D6', '#C5D9F5', '#C3EEDC', '#F2EAB8', '#DEC8F2'];

function CardText({ style, lines, children }: { style: TextStyle; lines?: number; children: ReactNode }) {
  return (
    <Text allowFontScaling={false} numberOfLines={lines} style={style}>
      {children}
    </Text>
  );
}

/** El paisaje: en la ventana o, en rubí y diamante, a toda la carta. */
function Scene({ face, scene, habitat }: { face: CardFace; scene: ImageSourcePropType; habitat: CardHabitat }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const box = face.fullArt ? { left: 7, top: 7, width: 286, height: 406, borderRadius: 10 } : { left: 12, top: 62, width: 276, height: 190, borderRadius: 8 };
  const imageHeight = box.width * 1.4;
  const offset = (imageHeight - box.height) * SCENE_FOCUS[habitat];
  return (
    <View style={[styles.layer, box, { overflow: 'hidden', borderWidth: face.fullArt ? 0 : 1.5, borderColor: face.trim ?? HABITAT_INKS[habitat] }]}>
      <Image source={scene} style={{ position: 'absolute', left: 0, top: face.fullArt ? 0 : -offset, width: box.width, height: face.fullArt ? box.height : imageHeight }} resizeMode="cover" />
      {face.veil && <View style={[StyleSheet.absoluteFill, { backgroundColor: face.veil }]} />}
      {face.shine && face.shine.length > 1 && !face.fullArt && (
        <Svg style={StyleSheet.absoluteFill} width={box.width} height={box.height}>
          <Defs>
            <LinearGradient id={`${uid}p`} x1="0" y1="0" x2="1" y2="1">
              {PRISM.map((color, i) => (
                <Stop key={color} offset={i / (PRISM.length - 1)} stopColor={color} stopOpacity={0.32} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={box.width} height={box.height} fill={`url(#${uid}p)`} />
        </Svg>
      )}
    </View>
  );
}

/** La luz bajo el dedo: un círculo suave que sigue el toque. */
function TouchGlow({ style }: { style: object }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Animated.View style={[styles.glow, style]} pointerEvents="none">
      <Svg width={GLOW} height={GLOW}>
        <Defs>
          <RadialGradient id={`${uid}g`} cx="50%" cy="50%" r="50%">
            <Stop offset={0} stopColor="#FFFFFF" stopOpacity={0.5} />
            <Stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={GLOW} height={GLOW} fill={`url(#${uid}g)`} />
      </Svg>
    </Animated.View>
  );
}

const GLOW = 240;

export function BirdCard(props: FrontProps) {
  const { finish, habitat, habitatLabel, name, scientificName, observations, ribbon, traits, facts, seals, collection, finishLabel, figure, art, frame, scene, relief, size = CARD_WIDTH, still = false, accessibilityLabel } = props;
  const face = CARD_FACES[finish];
  const k = size / CARD_WIDTH;
  const ink = HABITAT_INKS[habitat];
  const shines = !!face.shine;
  const reduced = useReducedMotion();
  const tilts = shines && !still && !reduced;

  // Solo valores compartidos: mover el dedo no vuelve a pintar la carta en React.
  const touchX = useSharedValue(CARD_WIDTH / 2);
  const touchY = useSharedValue(CARD_HEIGHT / 2);
  const pressed = useSharedValue(0);

  const tiltStyle = useAnimatedStyle(() => {
    const amount = tilts ? pressed.get() : 0;
    return {
      transform: [
        { perspective: 900 },
        { rotateX: `${(0.5 - touchY.get() / CARD_HEIGHT) * 12 * amount}deg` },
        { rotateY: `${(touchX.get() / CARD_WIDTH - 0.5) * 14 * amount}deg` },
      ],
    };
  });
  const glowStyle = useAnimatedStyle(() => ({
    opacity: pressed.get(),
    transform: [{ translateX: touchX.get() - GLOW / 2 }, { translateY: touchY.get() - GLOW / 2 }],
  }));

  const follow = ({ nativeEvent }: GestureResponderEvent) => {
    touchX.set(nativeEvent.locationX / k);
    touchY.set(nativeEvent.locationY / k);
  };
  const press = (event: GestureResponderEvent) => {
    follow(event);
    pressed.set(withTiming(1, { duration: 120 }));
  };
  const release = () => pressed.set(withTiming(0, { duration: 300 }));

  const plate = { backgroundColor: face.plate, borderColor: face.plateEdge };
  const trim = face.trim ?? ink;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `${name}, ${scientificName}`}
      style={{ width: size, height: size * (CARD_HEIGHT / CARD_WIDTH) }}>
      <Animated.View style={[StyleSheet.absoluteFill, tiltStyle]}>
        <View style={[styles.card, { transform: [{ scale: k }], boxShadow: CARD_SHADOW, backgroundColor: ink }]}>
          <Image source={frame} style={styles.fill} resizeMode="cover" />
          <Scene face={face} scene={scene} habitat={habitat} />
          {face.sparkles.map((s, i) => (
            <CardSparkle key={i} x={s.x} y={s.y} size={s.size} color={face.sparkleColor} period={face.period} />
          ))}
          <BirdFigure
            figure={figure}
            art={art}
            size={face.fullArt ? 200 : 178}
            style={{ position: 'absolute', left: face.fullArt ? 50 : 60, top: face.fullArt ? 54 : 66 }}
          />
          <View style={styles.seals}>
            {seals.map((seal) => (
              <Image key={seal.label} source={seal.image} style={styles.seal} accessibilityLabel={`Sello: ${seal.label}`} />
            ))}
          </View>

          {/* Bajo las placas: la luz nunca pasa por encima de los textos. */}
          {face.shine && <CardShine width={CARD_WIDTH} height={CARD_HEIGHT} colors={face.shine} period={face.period} relief={relief} />}

          <View style={[styles.header, styles.plate, plate, { boxShadow: PLATE_SHADOW }]}>
            <View style={[styles.medal, { width: 32, height: 32, backgroundColor: ink, borderColor: trim }]} accessibilityLabel={habitatLabel}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <Path d={HABITAT_ICONS[habitat]} />
              </Svg>
            </View>
            <View style={styles.titles}>
              <CardText lines={2} style={{ fontFamily: FONT.display, fontSize: 15.5, lineHeight: 16.5, color: face.ink }}>{name}</CardText>
              <CardText lines={1} style={{ fontFamily: FONT.serif, fontSize: 12, lineHeight: 13, color: face.inkSoft }}>{scientificName}</CardText>
            </View>
            <View style={[styles.medal, { width: 36, height: 36, backgroundColor: ink, borderColor: trim }]}>
              <CardText style={{ fontFamily: FONT.display, fontSize: 15, lineHeight: 16, color: '#FFFFFF' }}>{observations}</CardText>
              <CardText style={{ fontFamily: FONT.bold, fontSize: 7.5, lineHeight: 8, color: '#FFFFFF' }}>obs.</CardText>
            </View>
          </View>

          <View style={[styles.ribbon, { backgroundColor: ink, borderColor: trim, boxShadow: PLATE_SHADOW }]}>
            <CardText lines={1} style={{ fontFamily: FONT.bold, fontSize: 10.5, lineHeight: 13, color: '#FFFFFF' }}>{ribbon}</CardText>
          </View>

          <View style={[styles.body, styles.plate, plate, { boxShadow: PLATE_SHADOW }]}>
            {traits.map((trait) => (
              <View key={trait.title} style={styles.trait}>
                <CardText lines={1} style={{ fontFamily: FONT.bold, fontSize: 12, lineHeight: 14, color: face.ink }}>{trait.title}</CardText>
                <CardText lines={2} style={{ fontFamily: FONT.regular, fontSize: 10.2, lineHeight: 12.6, color: face.inkSoft }}>{trait.text}</CardText>
              </View>
            ))}
            <Svg width={260} height={6} viewBox="0 0 260 6" fill="none">
              <Path d={`M0 5${'h6v-3h6v3'.repeat(22)}`} stroke={face.line} strokeWidth={1} />
            </Svg>
            <View style={styles.facts}>
              {facts.map((fact) => (
                <View key={fact.label} style={styles.fact}>
                  <CardText lines={1} style={{ fontFamily: FONT.bold, fontSize: 8.5, lineHeight: 10, letterSpacing: 0.4, textTransform: 'uppercase', color: face.inkSoft }}>{fact.label}</CardText>
                  <CardText lines={2} style={{ fontFamily: FONT.bold, fontSize: 10.2, lineHeight: 11.5, color: face.ink }}>{fact.value}</CardText>
                </View>
              ))}
            </View>
            <View style={styles.footer}>
              <CardText lines={1} style={{ fontFamily: FONT.bold, fontSize: 9.2, lineHeight: 12, color: face.inkSoft }}>{collection}</CardText>
              <CardText lines={1} style={{ flex: 1, textAlign: 'center', fontFamily: FONT.bold, fontSize: 9.2, lineHeight: 12, color: face.inkSoft }}>{seals.map((s) => s.label).join(' · ')}</CardText>
              <CardText lines={1} style={{ fontFamily: FONT.bold, fontSize: 9.2, lineHeight: 12, color: face.inkSoft }}>{finishLabel}</CardText>
            </View>
          </View>

          {shines && <TouchGlow style={glowStyle} />}
        </View>
      </Animated.View>
      {shines && (
        <View
          style={StyleSheet.absoluteFill}
          onTouchStart={press}
          onTouchMove={follow}
          onTouchEnd={release}
          onTouchCancel={release}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}
    </View>
  );
}

export type CardMilestone = { goal: number; label: string; image: ImageSourcePropType; reached: boolean };

type BackProps = {
  /** «Tu registro · N.º 230». */
  eyebrow: string;
  name: string;
  rows: readonly CardFact[];
  /** «Hitos · 5 observaciones». */
  observations: string;
  milestones: readonly CardMilestone[];
  seals: readonly (CardSeal & { meaning: string })[];
  /** Dato de campo, si la especie lo tiene. */
  note?: { label: string; text: string };
  place: string;
  frame: ImageSourcePropType;
  size?: number;
};

const PAPER_INK = '#1E2A1B';
const PAPER_SOFT = '#4F5B43';

/** El reverso: el registro de quien tiene la carta. */
export function BirdCardBack({ eyebrow, name, rows, observations, milestones, seals, note, place, frame, size = CARD_WIDTH }: BackProps) {
  const k = size / CARD_WIDTH;
  const label: TextStyle = { fontFamily: FONT.bold, fontSize: 9.5, lineHeight: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: PAPER_SOFT };
  return (
    <View accessible style={{ width: size, height: size * (CARD_HEIGHT / CARD_WIDTH) }}>
      <View style={[styles.card, { transform: [{ scale: k }], boxShadow: CARD_SHADOW, backgroundColor: PAPER_INK }]}>
        <Image source={frame} style={styles.fill} resizeMode="cover" />
        <View style={[styles.sheet, { boxShadow: PLATE_SHADOW }]}>
          <View>
            <CardText style={{ ...label, fontSize: 10 }}>{eyebrow}</CardText>
            <CardText lines={2} style={{ fontFamily: FONT.display, fontSize: 20, lineHeight: 21, color: PAPER_INK }}>{name}</CardText>
          </View>
          <View style={styles.rows}>
            {rows.map((row) => (
              <View key={row.label} style={styles.row}>
                <CardText lines={1} style={label}>{row.label}</CardText>
                <CardText lines={2} style={{ fontFamily: FONT.bold, fontSize: 12.5, lineHeight: 14.5, color: PAPER_INK }}>{row.value}</CardText>
              </View>
            ))}
          </View>
          <View style={styles.section}>
            <CardText style={label}>{observations}</CardText>
            <View style={styles.milestones}>
              {milestones.map((milestone) => (
                <View key={milestone.goal} style={styles.milestone}>
                  <View style={styles.milestoneBar}>
                    {milestone.reached && <Image source={milestone.image} style={styles.milestoneFrame} resizeMode="cover" />}
                  </View>
                  <CardText style={{ fontFamily: FONT.bold, fontSize: 11, lineHeight: 13, color: PAPER_INK }}>{milestone.goal}</CardText>
                  <CardText lines={1} style={{ fontFamily: FONT.regular, fontSize: 7.6, lineHeight: 10, color: PAPER_SOFT }}>{milestone.label}</CardText>
                </View>
              ))}
            </View>
          </View>
          {seals.length > 0 && (
            <View style={styles.section}>
              {seals.map((seal) => (
                <View key={seal.label} style={styles.sealRow}>
                  <Image source={seal.image} style={styles.sealSmall} />
                  <CardText lines={2} style={{ flex: 1, fontFamily: FONT.regular, fontSize: 11, lineHeight: 13.5, color: PAPER_INK }}>
                    <Text style={{ fontFamily: FONT.bold }}>{seal.label}.</Text> {seal.meaning}
                  </CardText>
                </View>
              ))}
            </View>
          )}
          {note && (
            <View style={styles.section}>
              <CardText style={label}>{note.label}</CardText>
              <CardText lines={3} style={{ fontFamily: FONT.serif, fontSize: 15.5, lineHeight: 18.5, color: PAPER_INK }}>{note.text}</CardText>
            </View>
          )}
          <View style={styles.place}>
            <CardText lines={2} style={{ fontFamily: FONT.bold, fontSize: 11, lineHeight: 13.5, color: PAPER_INK }}>{place}</CardText>
          </View>
        </View>
      </View>
    </View>
  );
}

/** El dorso bordado: lo que se ve antes de revelar una carta. */
export function BirdCardCover({ image, size = CARD_WIDTH }: { image: ImageSourcePropType; size?: number }) {
  return (
    <View style={[styles.cover, { width: size, height: size * (CARD_HEIGHT / CARD_WIDTH), boxShadow: CARD_SHADOW }]}>
      <Image source={image} style={StyleSheet.absoluteFill} resizeMode="cover" />
    </View>
  );
}

const FLIP_EASING = cubicBezier(0.77, 0, 0.175, 1);

/** Las dos caras de la carta. Sin animaciones, cambia de cara sin girar. */
export function FlipCard({ front, back, flipped, size = CARD_WIDTH }: { front: ReactNode; back: ReactNode; flipped: boolean; size?: number }) {
  const reduced = useReducedMotion();
  const box = { width: size, height: size * (CARD_HEIGHT / CARD_WIDTH) };
  if (reduced) return <View style={box}>{flipped ? back : front}</View>;
  const face = (angle: number) => ({
    transform: [{ perspective: 1200 }, { rotateY: `${angle}deg` }],
    transitionProperty: 'transform' as const,
    transitionDuration: 550,
    transitionTimingFunction: FLIP_EASING,
  });
  return (
    <View style={box}>
      <Animated.View style={[styles.face, face(flipped ? 180 : 0)]} pointerEvents={flipped ? 'none' : 'auto'}>{front}</Animated.View>
      <Animated.View style={[styles.face, face(flipped ? 360 : 180)]} pointerEvents={flipped ? 'auto' : 'none'}>{back}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    transformOrigin: 'top left',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  layer: {
    position: 'absolute',
  },
  seals: {
    position: 'absolute',
    right: 17,
    top: 67,
    flexDirection: 'row',
    gap: 2,
  },
  seal: {
    width: 52,
    height: 52,
  },
  plate: {
    borderWidth: 1,
    borderRadius: 8,
  },
  header: {
    position: 'absolute',
    left: 12,
    top: 12,
    width: 276,
    height: 46,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  medal: {
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  ribbon: {
    position: 'absolute',
    left: 24,
    top: 245,
    width: 252,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    position: 'absolute',
    left: 12,
    top: 270,
    width: 276,
    height: 139,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 3,
  },
  trait: {
    height: 40,
  },
  facts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 1,
  },
  fact: {
    flex: 1,
    minWidth: 0,
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glow: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: GLOW,
    height: GLOW,
  },
  face: {
    position: 'absolute',
    left: 0,
    top: 0,
    backfaceVisibility: 'hidden',
  },
  cover: {
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#E0B348',
    overflow: 'hidden',
  },
  sheet: {
    position: 'absolute',
    left: 12,
    top: 12,
    width: 276,
    height: 396,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.28)',
    backgroundColor: '#FBF6E9',
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 11,
    gap: 9,
  },
  rows: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 7,
  },
  row: {
    width: '50%',
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(30,42,27,0.2)',
    paddingTop: 7,
    gap: 3,
  },
  milestones: {
    flexDirection: 'row',
    gap: 5,
  },
  milestone: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  milestoneBar: {
    width: '100%',
    height: 9,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#E7EEDC',
    borderWidth: 1,
    borderColor: 'rgba(30,42,27,0.16)',
  },
  // La franja superior del marco: es la que se ve en la carta; el centro queda tapado por las placas.
  milestoneFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    aspectRatio: CARD_WIDTH / CARD_HEIGHT,
  },
  sealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sealSmall: {
    width: 26,
    height: 26,
  },
  place: {
    marginTop: 'auto',
    borderRadius: 8,
    backgroundColor: '#F0E8D3',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
});
