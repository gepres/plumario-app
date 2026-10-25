import { describe, expect, it } from 'vitest';

import { handleProblem, isEmailLike, isPasswordValid, newProfile, normalizeHandle, passwordRules } from './account';

describe('contraseña', () => {
  it('pide al menos 8 caracteres, una letra y un número', () => {
    expect(passwordRules('aves2026')).toEqual([
      { rule: 'length', met: true }, { rule: 'letter', met: true }, { rule: 'number', met: true },
    ]);
    expect(isPasswordValid('aves2026')).toBe(true);
    expect(isPasswordValid('corta1')).toBe(false);
    expect(isPasswordValid('soloLetras')).toBe(false);
    expect(isPasswordValid('12345678')).toBe(false);
    expect(isPasswordValid('ñandú2026')).toBe(true);
  });
});

describe('usuario', () => {
  it('quita la arroba y los espacios, y pasa a minúsculas', () => {
    expect(normalizeHandle('  @Ana_Ica ')).toBe('ana_ica');
  });
  it('acepta minúsculas, números, «_» y «.», de 3 a 24', () => {
    expect(handleProblem('ana.ica_2026')).toBeNull();
    expect(handleProblem('an')).toBe('too-short');
    expect(handleProblem('a'.repeat(25))).toBe('too-long');
    expect(handleProblem('ana ica')).toBe('invalid-characters');
  });
});

describe('correo y perfil', () => {
  it('reconoce un correo con forma válida', () => {
    expect(isEmailLike('coleccionista@ejemplo.com')).toBe(true);
    expect(isEmailLike('coleccionista@')).toBe(false);
  });
  it('un perfil nuevo arranca en Ica, sin ubicación y con el álbum privado', () => {
    expect(newProfile({ displayName: ' Ana ', handle: 'ana', at: new Date(2026, 9, 24) })).toEqual({
      displayName: 'Ana', handle: 'ana', regionId: 'ica', favoriteSpeciesId: null, handleChangedAt: null,
      privacy: { saveLocation: false, albumVisibility: 'private', showName: true, improveAi: false }, createdAt: new Date(2026, 9, 24),
    });
  });
});
