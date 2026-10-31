import { describe, expect, it } from 'vitest';

import { conservationStatus, formatMass, formatWing, formatWingspan, speciesSeals } from './species-card';

const none = { iucn: 'LC', nationalCategory: null, threatened: false, endemic: false, emblematic: false };

describe('estado de conservación', () => {
  it('manda la lista del Perú, sea más alta o más baja que la UICN', () => {
    expect(conservationStatus({ iucn: 'NT', nationalCategory: 'EN' })).toEqual({ category: 'EN', scope: 'peru' });
    expect(conservationStatus({ iucn: 'EN', nationalCategory: 'VU' })).toEqual({ category: 'VU', scope: 'peru' });
  });

  it('sin categoría peruana usa la UICN', () => {
    expect(conservationStatus({ iucn: 'VU', nationalCategory: null })).toEqual({ category: 'VU', scope: 'global' });
  });

  it('no inventa un estado si no hay datos', () => {
    expect(conservationStatus({ iucn: null, nationalCategory: null })).toBeNull();
  });
});

describe('sellos de la especie', () => {
  it('amenazada le gana a casi amenazada aunque la UICN diga NT', () => {
    expect(speciesSeals({ ...none, iucn: 'NT', nationalCategory: 'EN', threatened: true, emblematic: true })).toEqual(['threatened', 'emblematic']);
  });

  it('casi amenazada vale en la UICN o en el Perú', () => {
    expect(speciesSeals({ ...none, iucn: 'NT', emblematic: true })).toEqual(['nearThreatened', 'emblematic']);
    expect(speciesSeals({ ...none, nationalCategory: 'NT' })).toEqual(['nearThreatened']);
  });

  it('una especie sin nada especial no lleva sello', () => {
    expect(speciesSeals({ ...none, endemic: true })).toEqual(['endemic']);
    expect(speciesSeals(none)).toEqual([]);
  });
});

describe('medidas de la carta', () => {
  it('pesa en gramos o en kilos', () => {
    expect(formatMass(150.6)).toBe('151 g');
    expect(formatMass(3427.8)).toBe('3,4 kg');
    expect(formatMass(2000)).toBe('2 kg');
  });

  it('muestra un decimal solo en alas pequeñas', () => {
    expect(formatWing(615)).toBe('ala 62 cm');
    expect(formatWing(102.5)).toBe('ala 10,3 cm');
    expect(formatWing(180)).toBe('ala 18 cm');
  });
});
