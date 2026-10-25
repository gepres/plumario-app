import { useId } from 'react';
import { View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { FINISHES, type ChromeFinish } from './sticker-finishes';
import { ConicFill, paintDefinition, paintFill } from './svg-paint';

/**
 * El sello redondo de una categoría de cromo, el mismo de la insignia del sticker
 * (RecompensasStickers: «Tus cromos por categoría»).
 */
export function CategoryBadge({ category, size = 32 }: { category: ChromeFinish; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const badge = FINISHES[category].badge;
  const border = Math.max(1.5, size / 16);
  const inner = size - border * 2;
  const box = { x: 0, y: 0, width: 36, height: 36 };
  return (
    <View
      accessible={false}
      style={{ width: size, height: size, borderRadius: size / 2, borderWidth: border, borderColor: badge.border, boxShadow: badge.shadow, overflow: 'hidden' }}>
      <Svg width={inner} height={inner} viewBox="0 0 36 36">
        <Defs>
          <ClipPath id={`${uid}c`}>
            <Rect x={0} y={0} width={36} height={36} rx={18} />
          </ClipPath>
          {paintDefinition(`${uid}p`, badge.background, box)}
        </Defs>
        {badge.background.type === 'conic' ? (
          <ConicFill paint={badge.background} box={box} clipPath={`url(#${uid}c)`} />
        ) : (
          <Rect x={0} y={0} width={36} height={36} rx={18} fill={paintFill(`${uid}p`, badge.background) ?? 'none'} />
        )}
        <G transform="translate(8 8) scale(0.8333)">
          <Path d={badge.icon} fill={badge.iconFill} fillRule="evenodd" />
          {badge.icon2 && <Path d={badge.icon2} fill={badge.icon2Fill} />}
        </G>
      </Svg>
    </View>
  );
}
