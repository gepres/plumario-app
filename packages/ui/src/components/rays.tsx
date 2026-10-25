import { useId } from 'react';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';

type Props = {
  /** Diámetro del círculo de rayos. */
  size: number;
  /** Color de los rayos (con su transparencia). */
  color: string;
  /** Color al que se funden los bordes: el fondo de la pantalla. */
  fade: string;
  /** Ancho de cada rayo en grados; entre rayo y rayo queda el mismo hueco. */
  step?: number;
};

/**
 * Rayos que salen del centro y se funden con el fondo, detrás del sticker que se celebra
 * (RegistrarCompletado, RevelarCromado: repeating-conic-gradient con un radial encima).
 */
export function Rays({ size, color, fade, step = 8 }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const r = size / 2;
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${(r + r * Math.sin(rad)).toFixed(2)} ${(r - r * Math.cos(rad)).toFixed(2)}`;
  };
  const rays = [];
  for (let start = step; start < 360; start += step * 2) {
    rays.push(<Path key={start} d={`M${r} ${r} L${point(start)} A${r} ${r} 0 0 1 ${point(start + step)} Z`} fill={color} />);
  }
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx={r} cy={r} r={r} gradientUnits="userSpaceOnUse">
          <Stop offset={0.2} stopColor={fade} stopOpacity={0} />
          <Stop offset={0.66} stopColor={fade} stopOpacity={1} />
        </RadialGradient>
      </Defs>
      <G>{rays}</G>
      <Circle cx={r} cy={r} r={r} fill={`url(#${id})`} />
    </Svg>
  );
}
