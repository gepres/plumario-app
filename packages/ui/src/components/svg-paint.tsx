import { G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

// Pinturas del CSS del diseño llevadas a react-native-svg, en coordenadas de la caja que se pinta.
// SVG no tiene degradado cónico: se arma con cuñas finas de color sólido, que a tamaño de sticker
// no se distinguen de un barrido continuo. Así los cromos funcionan igual en Android, iOS y web sin
// sumar Skia.

export type PaintStop = { color: string; position: number };

export type Paint =
  | { type: 'solid'; color: string }
  | { type: 'linear'; angle: number; stops: readonly PaintStop[] }
  /** `from` en grados (0 = arriba, sentido horario, como CSS); `at` es el centro en fracciones de la caja. */
  | { type: 'conic'; from: number; at?: readonly [number, number]; colors: readonly string[] }
  /** `circle at x% y%`: el radio llega a la esquina más lejana, y las posiciones son fracciones de ese radio. */
  | { type: 'radial'; at: readonly [number, number]; stops: readonly PaintStop[] };

type Rgba = [number, number, number, number];

function parseColor(color: string): Rgba {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color)?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
    return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16), 1];
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(color)?.[1];
  if (rgb) {
    const [r = 0, g = 0, b = 0, a = 1] = rgb.split(',').map((part) => Number(part.trim()));
    return [r, g, b, a];
  }
  return [0, 0, 0, color === 'transparent' ? 0 : 1];
}

const rgb = ([r, g, b]: Rgba) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;

/**
 * Parada de degradado con la transparencia aparte: react-native-svg en Android ignora el alfa de un
 * rgba() en stopColor, y el brillo translúcido salía opaco.
 */
function stopProps(color: string) {
  const parsed = parseColor(color);
  return { stopColor: rgb(parsed), stopOpacity: parsed[3] };
}

/** El color de un barrido en la fracción `t`, con las paradas repartidas por igual (como CSS sin posiciones). */
function sampleEven(colors: readonly string[], t: number, opaque = false): string {
  const parsed = colors.map(parseColor);
  const span = parsed.length - 1;
  const at = Math.min(Math.max(t, 0), 1) * span;
  const i = Math.min(Math.floor(at), span - 1);
  const f = at - i;
  const [a, b] = [parsed[i]!, parsed[i + 1]!];
  const mix = a.map((v, k) => v + (b[k]! - v) * f) as Rgba;
  if (opaque) return rgb(mix);
  return `rgba(${Math.round(mix[0]!)},${Math.round(mix[1]!)},${Math.round(mix[2]!)},${mix[3]!.toFixed(3)})`;
}

type Box = { x: number; y: number; width: number; height: number };

/** La definición de un degradado lineal o radial (va dentro de <Defs>); null para las demás pinturas. */
export function paintDefinition(id: string, paint: Paint, box: Box) {
  if (paint.type === 'solid' || paint.type === 'conic') return null;
  const stops = paint.stops.map((s, i) => <Stop key={i} offset={s.position} {...stopProps(s.color)} />);
  if (paint.type === 'linear') {
    // Igual que CSS: la línea pasa por el centro y mide |W·sen θ| + |H·cos θ|.
    const rad = (paint.angle * Math.PI) / 180;
    const [dx, dy] = [Math.sin(rad), -Math.cos(rad)];
    const half = (Math.abs(box.width * dx) + Math.abs(box.height * dy)) / 2;
    const [cx, cy] = [box.x + box.width / 2, box.y + box.height / 2];
    return (
      <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={cx - dx * half} y1={cy - dy * half} x2={cx + dx * half} y2={cy + dy * half}>
        {stops}
      </LinearGradient>
    );
  }
  const [cx, cy] = [box.x + paint.at[0] * box.width, box.y + paint.at[1] * box.height];
  const corners = [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]] as const;
  const r = Math.max(...corners.map(([x, y]) => Math.hypot(x - cx, y - cy)));
  return (
    <RadialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
      {stops}
    </RadialGradient>
  );
}

/** El relleno para usar en `fill`: un color, o la referencia a la definición de paintDefinition. */
export function paintFill(id: string, paint: Paint): string | null {
  if (paint.type === 'solid') return paint.color;
  if (paint.type === 'conic') return null;
  return `url(#${id})`;
}

const SEGMENTS = 96;

/** Un degradado cónico como abanico de cuñas, recortado por `clipPath` (la forma que se pinta). */
export function ConicFill({ paint, box, clipPath, opacity = 1 }: { paint: Extract<Paint, { type: 'conic' }>; box: Box; clipPath?: string; opacity?: number }) {
  const [ax, ay] = paint.at ?? [0.5, 0.5];
  const [cx, cy] = [box.x + ax * box.width, box.y + ay * box.height];
  const r = Math.hypot(Math.max(cx - box.x, box.x + box.width - cx), Math.max(cy - box.y, box.y + box.height - cy)) + 1;
  const step = 360 / SEGMENTS;
  // Si todas las paradas comparten la transparencia (los reflejos holográficos), las cuñas se pintan
  // opacas y el grupo lleva el alfa: translúcidas, sus solapes sumarían opacidad y se verían rayas.
  const alphas = paint.colors.map((c) => parseColor(c)[3]);
  const shared = alphas.every((a) => a === alphas[0]) ? alphas[0]! : 1;
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${(cx + r * Math.sin(rad)).toFixed(2)} ${(cy - r * Math.cos(rad)).toFixed(2)}`;
  };
  const wedges = Array.from({ length: SEGMENTS }, (_, i) => {
    const start = paint.from + i * step;
    // Cada cuña pisa un poco a la siguiente para que el antialias no deje rayitas entre ellas.
    const d = `M${cx.toFixed(2)} ${cy.toFixed(2)} L${point(start)} A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${point(start + step + 0.6)} Z`;
    return <Path key={i} d={d} fill={sampleEven(paint.colors, (i + 0.5) / SEGMENTS, shared < 1)} />;
  });
  return (
    <G clipPath={clipPath} opacity={opacity * shared}>
      {wedges}
    </G>
  );
}
