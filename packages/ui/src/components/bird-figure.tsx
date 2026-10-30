import { memo } from 'react';
import { Image, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { FIGURE_SVGS, type FigureName } from '../figures/figure-svgs';

/** El dibujo propio de una especie: su ilustración. */
export type BirdArt = { image: ImageSourcePropType };

type Props = {
  figure: FigureName;
  size: number;
  /** Sin color: la silueta de una especie que aún no está en el álbum. */
  silhouette?: { color: string; opacity: number };
  /** El dibujo de la especie, en lugar de la figura de su grupo. La silueta sigue siendo la del grupo. */
  art?: BirdArt;
  style?: StyleProp<ViewStyle>;
};

// La silueta es la misma figura con todo pintado de un color (como `filter: brightness(0)` del
// diseño). Se calcula una vez por figura y color.
const silhouettes = new Map<string, string>();

function silhouetteXml(figure: FigureName, color: string): string {
  const key = `${figure}|${color}`;
  let xml = silhouettes.get(key);
  if (!xml) {
    xml = FIGURE_SVGS[figure].replace(/(fill|stroke)="(?!none)[^"]*"/g, `$1="${color}"`);
    silhouettes.set(key, xml);
  }
  return xml;
}

/** La figura de un ave: el dibujo de la especie o el de su grupo (SistemaSiluetas), en color o como silueta. */
export const BirdFigure = memo(function BirdFigure({ figure, size, silhouette, art, style }: Props) {
  if (!silhouette && art) {
    return (
      <View style={[{ width: size, height: size }, style]}>
        <Image source={art.image} style={{ width: size, height: size }} resizeMode="contain" />
      </View>
    );
  }
  const xml = silhouette ? silhouetteXml(figure, silhouette.color) : FIGURE_SVGS[figure];
  return <SvgXml xml={xml} width={size} height={size} style={[silhouette && { opacity: silhouette.opacity }, style]} />;
});
