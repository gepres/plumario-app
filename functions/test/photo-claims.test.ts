import { describe, expect, it } from 'vitest';

import { photoClaimId } from '../src/photo-claims.js';

describe('huella de una foto', () => {
  it('es la misma para el mismo archivo, aunque llegue en otro registro', () => {
    expect(photoClaimId(Buffer.from('foto'))).toBe(photoClaimId(Buffer.from('foto')));
  });

  it('cambia con cualquier byte', () => {
    expect(photoClaimId(Buffer.from('foto'))).not.toBe(photoClaimId(Buffer.from('foto!')));
  });

  it('sirve como id de documento', () => {
    expect(photoClaimId(Buffer.from('foto'))).toMatch(/^[a-f0-9]{64}$/);
  });
});
