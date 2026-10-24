import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { colors, designKeyMap, palette, themes, type ColorMode, type Gradient, type Theme } from './index';

// Contraste WCAG 2.x. Los rgba se componen sobre su fondo antes de medir.
type Rgba = { rgb: [number, number, number]; alpha: number };

function parse(color: string): Rgba {
  const hex = /^#([\da-f]{6})([\da-f]{2})?$/i.exec(color);
  if (hex) {
    const n = (i: number) => Number.parseInt(hex[1]!.slice(i, i + 2), 16) / 255;
    return { rgb: [n(0), n(2), n(4)], alpha: hex[2] ? Number.parseInt(hex[2], 16) / 255 : 1 };
  }
  const rgba = /^rgba?\(([^)]*)\)$/i.exec(color);
  if (rgba) {
    const [r, g, b, a = '1'] = rgba[1]!.split(',').map((c) => c.trim());
    return { rgb: [Number(r) / 255, Number(g) / 255, Number(b) / 255], alpha: Number(a) };
  }
  throw new Error(`Color que la prueba no sabe leer: ${color}`);
}

function over(front: Rgba, back: Rgba): Rgba {
  const a = front.alpha;
  return { rgb: front.rgb.map((c, i) => c * a + back.rgb[i]! * (1 - a)) as Rgba['rgb'], alpha: 1 };
}

function luminance({ rgb }: Rgba) {
  const [r, g, b] = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(front: string, back: string, base = '#FFFFFF') {
  const b = over(parse(back), parse(base));
  const f = over(parse(front), b);
  const [lighter, darker] = [luminance(f), luminance(b)].sort((x, y) => y - x);
  return (lighter! + 0.05) / (darker! + 0.05);
}

const TEXT = 4.5;
const GRAPHIC = 3;

describe.each(['light', 'dark'] as ColorMode[])('paleta %s', (mode) => {
  const t: Theme = themes[mode];
  const stops = (g: Gradient) => g.stops.map((s) => s.color);

  it.each([
    ['text', 'background'], ['text', 'surface'], ['text', 'surfaceAlt'], ['text', 'field'],
    ['textSecondary', 'background'], ['textSecondary', 'surface'],
    ['primary', 'background'], ['primary', 'surface'],
    ['onPrimary', 'primary'], ['onAccent', 'accent'], ['onSun', 'sun'],
    ['success', 'background'], ['warning', 'background'], ['error', 'background'],
  ] as const)('texto %s sobre %s llega a AA', (front, back) => {
    expect(contrast(t[front], t[back], t.background)).toBeGreaterThanOrEqual(TEXT);
  });

  it('el texto del hero se lee en todas sus paradas', () => {
    for (const stop of stops(t.hero)) {
      expect(contrast(t.onHero, stop)).toBeGreaterThanOrEqual(TEXT);
      expect(contrast(t.onHeroSecondary, stop)).toBeGreaterThanOrEqual(TEXT);
    }
  });

  it('el ícono del botón Registrar se lee en todo el degradado', () => {
    for (const stop of stops(t.fab)) expect(contrast(t.onFab, stop)).toBeGreaterThanOrEqual(TEXT);
  });

  it.each([
    ['border', 'field'], ['tabActiveStroke', 'tabBar'], ['tabInactive', 'tabBar'],
  ] as const)('gráfico %s sobre %s llega a 3:1', (front, back) => {
    expect(contrast(t[front], t[back], t.background)).toBeGreaterThanOrEqual(GRAPHIC);
  });
});

describe('sincronía con el diseño', () => {
  const path = new URL('../../../diseno/paletas/paletas.json', import.meta.url);
  const design = JSON.parse(readFileSync(path, 'utf8')) as Record<string, Record<string, unknown>>;
  const letter = palette.option.toLowerCase();

  it.each([['light', 'claro'], ['dark', 'oscuro']] as const)('src/colors.ts está al día con paletas.json (%s)', (mode, designMode) => {
    const source = design[`${letter}-${designMode}`]!;
    const t = colors[mode] as unknown as Record<string, unknown>;
    for (const [designKey, codeKey] of Object.entries(designKeyMap)) {
      const value = t[codeKey];
      if (designKey === 'hab') expect(Object.values(value as object)).toEqual(source.hab);
      else if (typeof value === 'object') expect((value as { css: string }).css).toBe(source[designKey]);
      else expect(value, `${mode}.${codeKey}`).toBe(source[designKey]);
    }
  });
});
