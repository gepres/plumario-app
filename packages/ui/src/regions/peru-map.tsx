import { useMemo } from 'react';
import { SvgXml } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import { PERU_MAP_SVG } from './peru-map-svg';

type Props = {
  /** Alto en puntos; el ancho guarda la proporción del mapa. */
  height: number;
};

// Proporción del viewBox del mapa (342 × 472).
const ASPECT = 342 / 472;

/** El Perú con la región del álbum (Ica) resaltada: Perfil › Mi región y RegionLista. */
export function PeruMap({ height }: Props) {
  const { colors } = useTheme();
  const xml = useMemo(
    () => PERU_MAP_SVG.split('{{land}}').join(colors.line).split('{{border}}').join(colors.surface).split('{{region}}').join(colors.primary),
    [colors.line, colors.surface, colors.primary],
  );
  return <SvgXml xml={xml} width={height * ASPECT} height={height} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}
