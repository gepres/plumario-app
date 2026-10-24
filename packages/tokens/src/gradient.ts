export type GradientStop = { readonly color: string; readonly position: number };

/** Degradado de los tokens: ángulo y radio con la misma semántica que en CSS. */
export type Gradient =
  | { readonly type: 'linear'; readonly angle: number; readonly stops: readonly GradientStop[]; readonly css: string }
  | {
      readonly type: 'radial';
      readonly center: { readonly x: number; readonly y: number };
      readonly stops: readonly GradientStop[];
      readonly css: string;
    };
