import { describe, expect, it } from 'vitest';

import { parseAppearance } from './appearance';

describe('parseAppearance', () => {
  it('acepta las tres apariencias', () => {
    expect(parseAppearance('system')).toBe('system');
    expect(parseAppearance('light')).toBe('light');
    expect(parseAppearance('dark')).toBe('dark');
  });

  it('vuelve a la del teléfono si lo guardado no sirve', () => {
    expect(parseAppearance(undefined)).toBe('system');
    expect(parseAppearance('sepia')).toBe('system');
    expect(parseAppearance(1)).toBe('system');
  });
});
