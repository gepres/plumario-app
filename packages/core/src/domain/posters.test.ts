import { describe, expect, it } from 'vitest';

import { isHabitatPosterUnlocked, pickPosterSpecies, speciesPostersAvailable } from './posters';

const registered = Array.from({ length: 23 }, (_, i) => `especie-${i}`);

describe('pósteres cada 10 especies', () => {
  it('hay un póster por cada 10 especies', () => {
    expect(speciesPostersAvailable(9)).toBe(0);
    expect(speciesPostersAvailable(12)).toBe(1);
    expect(speciesPostersAvailable(23)).toBe(2);
  });

  it('elige 10 especies distintas de las registradas', () => {
    const picked = pickPosterSpecies(registered, 42);
    expect(picked).toHaveLength(10);
    expect(new Set(picked).size).toBe(10);
    expect(picked.every((id) => registered.includes(id))).toBe(true);
  });

  it('la misma semilla da el mismo póster; «Mezclar» cambia la semilla y la mezcla', () => {
    expect(pickPosterSpecies(registered, 42)).toEqual(pickPosterSpecies([...registered].reverse(), 42));
    expect(pickPosterSpecies(registered, 43)).not.toEqual(pickPosterSpecies(registered, 42));
  });

  it('con menos de 10 especies usa las que hay', () => {
    expect(pickPosterSpecies(registered.slice(0, 4), 1)).toHaveLength(4);
  });
});

describe('póster por hábitat', () => {
  it('se descarga al completar todas las especies del hábitat', () => {
    expect(isHabitatPosterUnlocked({ habitat: 'coast', registered: 8, total: 43 })).toBe(false);
    expect(isHabitatPosterUnlocked({ habitat: 'coast', registered: 43, total: 43 })).toBe(true);
    expect(isHabitatPosterUnlocked({ habitat: 'desert', registered: 0, total: 0 })).toBe(false);
  });
});
