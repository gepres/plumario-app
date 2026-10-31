import { describe, expect, it } from 'vitest';

import { at, species, sticker } from '../testing';
import { buildAlbumView } from './album-view';
import { homeView } from './home';
import { REGIONS, regionByMapId, searchRegions } from './regions';

const catalog = [
  species('zonotrichia-capensis', { albumNumber: 1, habitat: 'desert' }),
  species('coragyps-atratus', { albumNumber: 2, habitat: 'desert' }),
  species('playero', { albumNumber: 3, habitat: 'coast' }),
  species('gaviota', { albumNumber: 4, habitat: 'coast' }),
  species('zarapito', { albumNumber: 5, habitat: 'coast' }),
  species('pelicano', { albumNumber: 6, habitat: 'coast' }),
  species('guanay', { albumNumber: 7, habitat: 'coast' }),
  species('gaviotin', { albumNumber: 8, habitat: 'coast' }),
];

describe('Inicio', () => {
  it('sin aves, propone las fáciles de ver de la región', () => {
    const view = homeView(buildAlbumView(catalog, []), 'ica', at(25));
    expect(view.kind).toBe('empty');
    if (view.kind === 'empty') expect(view.easy.map((e) => e.species.id)).toEqual(['zonotrichia-capensis', 'coragyps-atratus']);
  });

  it('muestra las tres últimas (las de hace menos de dos días, como nuevas)', () => {
    const album = buildAlbumView(catalog, [
      sticker('zonotrichia-capensis', { completedAt: at(1) }),
      sticker('playero', { completedAt: at(10), best: 'holographic', unlocked: [{ finish: 'holographic', source: 'luck', at: at(24) }] }),
      sticker('gaviota', { completedAt: at(20) }),
      sticker('coragyps-atratus', { completedAt: at(5) }),
    ]);
    const view = homeView(album, 'ica', at(25));
    if (view.kind !== 'started') throw new Error('esperaba started');
    expect(view.latest.map((l) => [l.entry.species.id, l.isNew])).toEqual([['playero', true], ['gaviota', false], ['coragyps-atratus', false]]);
  });

  it('propone las que faltan del hábitat de la última ave y cuántas quedan', () => {
    const album = buildAlbumView(catalog, [sticker('playero', { completedAt: at(20) })]);
    const view = homeView(album, 'ica', at(25));
    if (view.kind !== 'started') throw new Error('esperaba started');
    expect(view.discover?.habitat).toBe('coast');
    expect(view.discover?.entries.map((e) => e.species.id)).toEqual(['gaviota', 'zarapito', 'pelicano']);
    expect(view.discover?.remaining).toBe(2);
    expect(view.nextMilestone).toBeNull();
  });
});

describe('regiones', () => {
  it('son las 24, con Ica disponible', () => {
    expect(REGIONS).toHaveLength(24);
    expect(REGIONS.filter((r) => r.available).map((r) => r.id)).toEqual(['ica']);
    expect(regionByMapId('ARE')?.name).toBe('Arequipa');
  });

  it('se buscan sin tildes', () => {
    expect(searchRegions('ancash').map((r) => r.name)).toEqual(['Áncash']);
    expect(searchRegions('')).toHaveLength(24);
  });
});
