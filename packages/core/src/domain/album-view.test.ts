import { describe, expect, it } from 'vitest';

import { at, species, sticker } from '../testing';
import { buildAlbumView, filterEntries, formatAlbumNumber, habitatPreview, searchEntries } from './album-view';
import { figureOf } from './figure';

const catalog = [
  species('gaviota-peruana', { albumNumber: 22, commonName: 'Gaviota Peruana', scientificName: 'Larus belcheri' }),
  species('playero-arenero', { albumNumber: 11, commonName: 'Playero Arenero', scientificName: 'Calidris alba' }),
  species('pinguino', { albumNumber: 32, commonName: 'Pingüino de Humboldt', scientificName: 'Spheniscus humboldti', iucn: 'VU', threatened: true }),
  species('flamenco', { albumNumber: 50, commonName: 'Flamenco Chileno', habitat: 'wetlands', iucn: 'NT', emblematic: true }),
  species('lobo-marino', { taxonClass: 'mammal', albumNumber: null }),
];

describe('vista del álbum', () => {
  const view = buildAlbumView(catalog, [sticker('gaviota-peruana', { completedAt: at(3) }), sticker('pinguino', { completedAt: at(9) })]);

  it('solo aves, en orden de número, con su sticker y su categoría', () => {
    expect(view.entries.map((e) => e.species.id)).toEqual(['playero-arenero', 'gaviota-peruana', 'pinguino', 'flamenco']);
    expect(view.entries[1]?.sticker?.speciesId).toBe('gaviota-peruana');
    expect(view.entries[2]?.finish).toBeNull();
    expect([view.registered, view.total]).toEqual([2, 4]);
  });

  it('cuenta cada hábitat y su vista previa pone primero lo último que registró', () => {
    const coast = view.habitats.find((h) => h.habitat === 'coast')!;
    expect([coast.registered, coast.total]).toEqual([2, 3]);
    expect(habitatPreview(coast, 5).map((e) => e.species.id)).toEqual(['pinguino', 'gaviota-peruana', 'playero-arenero']);
    expect(habitatPreview(coast, 1)).toHaveLength(1);
  });

  it('filtra «Tengo» y «Me faltan»', () => {
    expect(filterEntries(view.entries, 'owned')).toHaveLength(2);
    expect(filterEntries(view.entries, 'missing').map((e) => e.species.id)).toEqual(['playero-arenero', 'flamenco']);
  });

  it('busca sin tildes, por nombre común, científico o número', () => {
    expect(searchEntries(view.entries, 'pinguino').map((e) => e.species.id)).toEqual(['pinguino']);
    expect(searchEntries(view.entries, 'CALIDRIS').map((e) => e.species.id)).toEqual(['playero-arenero']);
    expect(searchEntries(view.entries, '22').map((e) => e.species.id)).toEqual(['gaviota-peruana']);
    expect(searchEntries(view.entries, '  ')).toHaveLength(4);
  });
});

describe('número y figura', () => {
  it('imprime el número con tres cifras', () => {
    expect(formatAlbumNumber(11)).toBe('011');
    expect(formatAlbumNumber(null)).toBe('—');
  });

  it('elige la figura por familia y, en Laridae, por género', () => {
    expect(figureOf({ family: 'Scolopacidae', genus: 'Calidris' })).toBe('shorebird');
    expect(figureOf({ family: 'Laridae', genus: 'Larus' })).toBe('gull');
    expect(figureOf({ family: 'Laridae', genus: 'Larosterna' })).toBe('tern');
    expect(figureOf({ family: 'Tyrannidae', genus: 'Pyrocephalus' })).toBe('songbird');
    expect(figureOf({ family: null })).toBe('songbird');
  });
});
