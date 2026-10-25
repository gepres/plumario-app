import Svg, { G, Path } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import { PERU_REGIONS, PERU_REGIONS_VIEWBOX } from './peru-regions';

type Props = {
  width: number;
  /** El id del mapa de la región elegida (ICA, ARE…). */
  selected: string | null;
  isAvailable: (mapId: string) => boolean;
  onSelect: (mapId: string) => void;
};

/**
 * RegionMapa: el Perú por regiones, para tocar una. Las disponibles van en el color principal y las
 * que vienen, apagadas; la elegida, con borde. La lista de regiones es la alternativa accesible.
 */
export function RegionMap({ width, selected, isAvailable, onSelect }: Props) {
  const { colors } = useTheme();
  const height = (width * PERU_REGIONS_VIEWBOX.height) / PERU_REGIONS_VIEWBOX.width;
  // La elegida se dibuja al final, para que su borde no quede tapado por las vecinas.
  const ordered = [...PERU_REGIONS].sort((a, b) => Number(a.id === selected) - Number(b.id === selected));
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${PERU_REGIONS_VIEWBOX.width} ${PERU_REGIONS_VIEWBOX.height}`} accessibilityLabel="Mapa de regiones del Perú">
      <G>
        {ordered.map((region) => {
          const available = isAvailable(region.id);
          const isSelected = region.id === selected;
          const fill = available ? colors.primary : isSelected ? colors.border : colors.line;
          return (
            <Path
              key={region.id}
              d={region.d}
              fill={fill}
              stroke={isSelected ? colors.text : colors.surface}
              strokeWidth={isSelected ? 2.4 : 1.2}
              strokeLinejoin="round"
              onPress={() => onSelect(region.id)}
            />
          );
        })}
      </G>
    </Svg>
  );
}
