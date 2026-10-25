import { describe, expect, it } from 'vitest';

import { categoryOf, isFairTrade } from './card';

// Los casos de design/project/CategoriasCromos.dc.html.
describe('categoryOf', () => {
  it('amenazada (VU, EN, CR) es Diamante, aunque además sea endémica o emblemática', () => {
    expect(categoryOf({ iucn: 'CR', endemic: true, emblematic: false })).toBe('diamond'); // Churrete de Vientre Blanco
    expect(categoryOf({ iucn: 'VU', endemic: false, emblematic: true })).toBe('diamond');
    expect(categoryOf({ iucn: 'EN', endemic: false, emblematic: false })).toBe('diamond'); // Gaviotín Peruano
  });
  it('emblemática es Rubí, por encima de endémica y casi amenazada', () => {
    expect(categoryOf({ iucn: 'NT', endemic: false, emblematic: true })).toBe('ruby'); // Flamenco Chileno
  });
  it('endémica es Oro', () => {
    expect(categoryOf({ iucn: 'LC', endemic: true, emblematic: false })).toBe('gold'); // Churrete Marisquero
  });
  it('casi amenazada (NT) es Plata', () => {
    expect(categoryOf({ iucn: 'NT', endemic: false, emblematic: false })).toBe('silver'); // Gaviotín Zarcillo
  });
  it('el resto es Holográfico', () => {
    expect(categoryOf({ iucn: 'LC', endemic: false, emblematic: false })).toBe('holographic'); // Playero Arenero
    expect(categoryOf({ iucn: null, endemic: false, emblematic: false })).toBe('holographic');
  });
});

describe('isFairTrade', () => {
  it('se da un cromo de igual o mayor categoría que el que se pide', () => {
    expect(isFairTrade('gold', 'gold')).toBe(true);
    expect(isFairTrade('diamond', 'silver')).toBe(true);
    expect(isFairTrade('silver', 'ruby')).toBe(false);
  });
});
