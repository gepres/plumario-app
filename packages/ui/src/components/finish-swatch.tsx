import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, Rect } from 'react-native-svg';

import { FINISHES, type ChromeFinish } from './sticker-finishes';
import { ConicFill, paintDefinition, paintFill } from './svg-paint';

/** Círculo con el acabado de una categoría de cromo, para etiquetas («Cromo holográfico»). */
export function FinishSwatch({ finish, size = 14 }: { finish: ChromeFinish; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const paint = FINISHES[finish].badge.background;
  const box = { x: 0, y: 0, width: 20, height: 20 };
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" accessible={false}>
      <Defs>
        <ClipPath id={`${uid}c`}>
          <Rect x={0} y={0} width={20} height={20} rx={10} />
        </ClipPath>
        {paintDefinition(`${uid}p`, paint, box)}
      </Defs>
      {paint.type === 'conic' ? <ConicFill paint={paint} box={box} clipPath={`url(#${uid}c)`} /> : <Circle cx={10} cy={10} r={10} fill={paintFill(`${uid}p`, paint) ?? 'none'} />}
      <Circle cx={10} cy={10} r={9.5} fill="none" stroke="rgba(20,48,47,0.2)" strokeWidth={1} />
    </Svg>
  );
}
