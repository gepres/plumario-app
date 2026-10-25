import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { BirdSticker, type StickerFinish } from '../components/bird-sticker';
import { Medal, type MedalKind } from '../components/medal';
import type { FigureName } from '../figures/figure-svgs';
import { textStyles } from '../theme/fonts';

/** La tarjeta para compartir se dibuja en 1080 × 1350 (4:5, la de las redes) y se exporta así. */
export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;

type Props = {
  /** Lo que se celebra: un sticker (con la foto propia, si se elige) o una medalla. */
  art: { sticker: { figure: FigureName; name: string; number: string; tint: string; finish: StickerFinish } } | { medal: { kind: MedalKind; number?: number } };
  /** La píldora de arriba: «¡Me salió cromado!». */
  badge: string;
  name: string;
  scientificName: string;
  /** Lo de abajo, separado por puntos: fecha, «Cromo 2», «12 de 289 especies». */
  meta: string[];
  /** «Agregar mi foto»: la foto propia junto a la figura del ave (solo con sticker). */
  photoUri?: string | null;
};

// Los colores son los del diseño (TarjetaLogro): la tarjeta se ve igual en modo claro y oscuro.
const INK = '#0F2423';
const CREAM = '#F3EDE2';

/** Rayos que salen del centro y se desvanecen (el repeating-conic-gradient del diseño). */
function rays(cx: number, cy: number, r: number, step: number) {
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${(cx + r * Math.sin(rad)).toFixed(1)} ${(cy - r * Math.cos(rad)).toFixed(1)}`;
  };
  const paths = [];
  for (let start = step; start < 360; start += step * 2) {
    paths.push(<Path key={start} d={`M${cx} ${cy} L${point(start)} A${r} ${r} 0 0 1 ${point(start + step)} Z`} fill="url(#rays)" />);
  }
  return paths;
}

/** TarjetaLogro: el sticker (y la foto, si se elige) o la medalla, para compartir un logro. */
export function ShareCard({ art, badge, name, scientificName, meta, photoUri }: Props) {
  return (
    <View style={styles.card}>
      <Svg width={SHARE_CARD_WIDTH} height={SHARE_CARD_HEIGHT} style={styles.fill}>
        <Defs>
          <RadialGradient id="bg" cx={540} cy={486} r={1019} gradientUnits="userSpaceOnUse">
            <Stop offset={0} stopColor="#2A5A56" />
            <Stop offset={0.62} stopColor={INK} />
          </RadialGradient>
          {/* Se desvanecen a transparente, no al color del fondo: así no queda un anillo sobre el degradado. */}
          <RadialGradient id="rays" cx={540} cy={460} r={707} gradientUnits="userSpaceOnUse">
            <Stop offset={0.2} stopColor="#FFFFFF" stopOpacity={0.07} />
            <Stop offset={0.66} stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={SHARE_CARD_WIDTH} height={SHARE_CARD_HEIGHT} fill="url(#bg)" />
        <G>{rays(540, 460, 500, 7.5)}</G>
      </Svg>

      <View style={styles.header}>
        <Text style={styles.brand}>Álbum Aves de Ica</Text>
        <Text style={styles.badge}>{badge}</Text>
      </View>

      {'medal' in art ? (
        <View style={styles.medal}>
          <Medal kind={art.medal.kind} number={art.medal.number} size={400} />
        </View>
      ) : photoUri ? (
        <View style={styles.withPhoto}>
          <View style={styles.photoFrame}>
            <Image source={{ uri: photoUri }} style={styles.photo} accessibilityLabel={`Tu foto del ${name}`} />
          </View>
          <View style={styles.smallSticker}>
            <BirdSticker {...art.sticker} size={300} />
          </View>
        </View>
      ) : (
        <View style={styles.bigSticker}>
          <BirdSticker {...art.sticker} size={420} />
        </View>
      )}

      <Text style={styles.name} numberOfLines={2}>{name}</Text>
      <Text style={styles.scientific}>{scientificName}</Text>
      <View style={styles.meta}>
        {meta.map((item, i) => (
          <View key={item} style={styles.metaItem}>
            {i > 0 && <View style={styles.dot} />}
            <Text style={styles.metaText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    overflow: 'hidden',
    padding: 80,
    alignItems: 'center',
    backgroundColor: INK,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  header: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: textStyles.title.fontFamily,
    fontSize: 34,
    letterSpacing: -0.34,
    color: CREAM,
  },
  badge: {
    fontFamily: textStyles.bodyStrong.fontFamily,
    fontSize: 24,
    color: '#14302F',
    backgroundColor: '#F2EAB8',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  bigSticker: {
    marginTop: 40,
    transform: [{ rotate: '-4deg' }],
    borderRadius: 32,
    boxShadow: '0 0 48px rgba(197,217,245,0.4)',
  },
  // Sin sombra: la medalla no es un rectángulo y el brillo dejaría una caja detrás.
  medal: {
    marginTop: 64,
    transform: [{ rotate: '-4deg' }],
  },
  withPhoto: {
    marginTop: 44,
    alignSelf: 'stretch',
    height: 700,
  },
  photoFrame: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 800,
    height: 640,
    borderRadius: 36,
    borderWidth: 10,
    borderColor: CREAM,
    overflow: 'hidden',
    backgroundColor: '#93B1BA',
    transform: [{ rotate: '-2deg' }],
    boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  smallSticker: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    transform: [{ rotate: '6deg' }],
    borderRadius: 24,
    boxShadow: '0 0 36px rgba(197,217,245,0.45)',
  },
  name: {
    marginTop: 40,
    width: '100%',
    fontFamily: textStyles.title.fontFamily,
    fontSize: 92,
    lineHeight: 96,
    letterSpacing: -2.3,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scientific: {
    marginTop: 10,
    width: '100%',
    fontFamily: textStyles.scientific.fontFamily,
    fontSize: 42,
    color: '#C9D8D4',
    textAlign: 'center',
  },
  meta: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E4C766',
    marginHorizontal: 18,
  },
  metaText: {
    fontFamily: textStyles.bodyStrong.fontFamily,
    fontSize: 27,
    color: CREAM,
  },
});
