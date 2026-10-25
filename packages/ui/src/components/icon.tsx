import Svg, { Path } from 'react-native-svg';

// Íconos de línea del diseño: grilla de 24, trazo de 1,8 a 2, puntas redondas (GuiaFundamentos).
// `fill` es la silueta que se rellena cuando el ícono está activo (pestañas de la barra).
const ICONS = {
  home: { stroke: 'M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z', fill: 'M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z' },
  album: { stroke: 'M4 5.5C7 4 10 4 12 6c2-2 5-2 8-.5V19c-3-1.5-6-1.5-8 .5-2-2-5-2-8-.5zM12 6v13.5', fill: 'M4 5.5C7 4 10 4 12 6c2-2 5-2 8-.5V19c-3-1.5-6-1.5-8 .5-2-2-5-2-8-.5z' },
  rewards: { stroke: 'M12 9a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8.6 10.2L6 3h4l2 4.5L14 3h4l-2.6 7.2', fill: 'M12 9a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z' },
  profile: { stroke: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c1-4 4.5-6 8-6s7 2 8 6', fill: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c1-4 4.5-6 8-6s7 2 8 6z' },
  camera: { stroke: 'M4 8h3l2-3h6l2 3h3v11H4zM12 9.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z' },
  image: { stroke: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM9 8.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM21 16l-5-5-8 8' },
  swap: { stroke: 'M4 8h14l-3-3M20 16H6l3 3' },
  flash: { stroke: 'M13 3L5 13h6l-1 8 8-10h-6z' },
  shuffle: { stroke: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5' },
  file: { stroke: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6' },
  shield: { stroke: 'M12 2.5l7.5 3v6c0 4.6-3.2 8.4-7.5 10-4.3-1.6-7.5-5.4-7.5-10v-6zM8.5 12l2.5 2.5 4.5-5' },
  share: { stroke: 'M12 15V3M7.5 7.5L12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7' },
  download: { stroke: 'M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14' },
  mail: { stroke: 'M3.5 6h17v12h-17zM3.5 6l8.5 7 8.5-7' },
  arrow: { stroke: 'M5 12h14M13 6l6 6-6 6' },
  chevronRight: { stroke: 'M9 5l7 7-7 7' },
  search: { stroke: 'M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM16 16l4.5 4.5' },
  back: { stroke: 'M15 5l-7 7 7 7' },
  check: { stroke: 'M5 12.5l4.5 4.5L19 7.5' },
  dot: { stroke: 'M12 11.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6z' },
  close: { stroke: 'M6 6l12 12M18 6L6 18' },
  alert: { stroke: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5v5.5M12 16.5h.01' },
  eye: { stroke: 'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z' },
  eyeOff: { stroke: 'M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.6M6.6 6.6C3.9 8.3 2.5 12 2.5 12s3.5 6 9.5 6c1.6 0 3-.4 4.2-1M9.9 9.9a2.5 2.5 0 0 0 3.5 3.5' },
  key: { stroke: 'M14.5 4.5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM10.9 12.6L3.5 20v1.5h3v-2h2v-2h2l1.4-1.4M15.5 8.5h.01' },
  lock: { stroke: 'M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3M12 15v2' },
} as const satisfies Record<string, { stroke: string; fill?: string }>;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  color: string;
  size?: number;
  strokeWidth?: number;
  /** Color de relleno de la silueta, para los íconos que la tienen (estado activo). */
  fill?: string;
};

export function Icon({ name, color, size = 24, strokeWidth = 1.9, fill }: Props) {
  const icon: { stroke: string; fill?: string } = ICONS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {fill && icon.fill && <Path d={icon.fill} fill={fill} />}
      <Path d={icon.stroke} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
