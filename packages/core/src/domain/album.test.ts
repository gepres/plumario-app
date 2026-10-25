import { describe, expect, it } from 'vitest';

import { species, sticker } from '../testing';
import { nextPoster, summarizeAlbum } from './album';

describe('nextPoster', () => {
  it('con 12 especies falta 8 para el póster 2, como en el diseño', () => {
    expect(nextPoster(12, 289)).toEqual({ number: 2, remaining: 8 });
  });
  it('al completar un póster, el siguiente pide 10 más', () => {
    expect(nextPoster(20, 289)).toEqual({ number: 3, remaining: 10 });
  });
  it('sin registros, el primer póster pide 10', () => {
    expect(nextPoster(0, 289)).toEqual({ number: 1, remaining: 10 });
  });
  it('no hay siguiente póster si el catálogo no alcanza', () => {
    expect(nextPoster(282, 289)).toBeNull();
  });
});

describe('summarizeAlbum', () => {
  const catalog = [species('a'), species('b'), species('c', { habitat: 'wetlands' }), species('d', { habitat: 'highlands' })];

  it('cuenta especies con sticker completado', () => {
    const summary = summarizeAlbum(catalog, [sticker('a'), sticker('c')]);
    expect(summary.registered).toBe(2);
    expect(summary.total).toBe(4);
  });

  it('desglosa el avance por hábitat en el orden del diseño', () => {
    expect(summarizeAlbum(catalog, [sticker('a'), sticker('c')]).byHabitat).toEqual([
      { habitat: 'coast', registered: 1, total: 2 },
      { habitat: 'wetlands', registered: 1, total: 1 },
      { habitat: 'desert', registered: 0, total: 0 },
      { habitat: 'highlands', registered: 0, total: 1 },
      { habitat: 'openSea', registered: 0, total: 0 },
    ]);
  });

  it('ignora stickers de especies que no están en el catálogo', () => {
    expect(summarizeAlbum(catalog, [sticker('zzz')]).registered).toBe(0);
  });

  it('el álbum es de aves: mamíferos y reptiles no cuentan, aunque tengan sticker', () => {
    const withOthers = [...catalog, species('lobo', { taxonClass: 'mammal' }), species('tortuga', { taxonClass: 'reptile', habitat: 'openSea' })];
    const summary = summarizeAlbum(withOthers, [sticker('lobo'), sticker('a')]);
    expect(summary.total).toBe(4);
    expect(summary.registered).toBe(1);
    expect(summary.byHabitat.find((h) => h.habitat === 'openSea')?.total).toBe(0);
  });

  it('una especie sin hábitat cuenta en el total pero en ningún hábitat', () => {
    const summary = summarizeAlbum([...catalog, species('e', { habitat: null })], [sticker('e')]);
    expect(summary.total).toBe(5);
    expect(summary.registered).toBe(1);
    expect(summary.byHabitat.reduce((n, h) => n + h.total, 0)).toBe(4);
  });
});
