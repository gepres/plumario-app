import { describe, expect, it } from 'vitest';

import { at, sticker } from '../testing';
import { CHROME_CHANCE, PHOTOS_FOR_CHROME } from './card';
import { applyValidPhoto, photosToChrome } from './sticker';

describe('applyValidPhoto', () => {
  it('la primera foto completa el sticker en versión normal', () => {
    const outcome = applyValidPhoto(null, 'playero', at(5), 0.9);
    expect(outcome.completed).toBe(true);
    expect(outcome.chromed).toBeNull();
    expect(outcome.sticker).toEqual({ speciesId: 'playero', completedAt: at(5), validPhotos: 1, chrome: null });
  });

  it('al completar sale cromo al azar, 1 de cada 8', () => {
    expect(applyValidPhoto(null, 'playero', at(5), CHROME_CHANCE - 0.001).chromed).toBe('luck');
    expect(applyValidPhoto(null, 'playero', at(5), CHROME_CHANCE).chromed).toBeNull();
  });

  it('las fotos siguientes no completan nada: suman para el cromo por fotos', () => {
    const outcome = applyValidPhoto(sticker('playero', { validPhotos: 2 }), 'playero', at(6), 0);
    expect(outcome.completed).toBe(false);
    expect(outcome.chromed).toBeNull();
    expect(outcome.sticker.validPhotos).toBe(3);
  });

  it('con las fotos validadas necesarias el sticker pasa a cromado', () => {
    const outcome = applyValidPhoto(sticker('playero', { validPhotos: PHOTOS_FOR_CHROME - 1 }), 'playero', at(7), 0.9);
    expect(outcome.chromed).toBe('photos');
    expect(outcome.sticker.chrome).toEqual({ source: 'photos', at: at(7) });
  });

  it('un cromo ya ganado no se pierde ni cambia de origen', () => {
    const chromed = sticker('playero', { validPhotos: 7, chrome: { source: 'luck', at: at(2) } });
    const outcome = applyValidPhoto(chromed, 'playero', at(8), 0);
    expect(outcome.chromed).toBeNull();
    expect(outcome.sticker.chrome).toEqual({ source: 'luck', at: at(2) });
  });
});

describe('photosToChrome', () => {
  it('dice cuántas fotos faltan («Pelícano 4 de 5 fotos»)', () => {
    expect(photosToChrome(sticker('pelicano', { validPhotos: 4 }))).toBe(1);
    expect(photosToChrome(sticker('pelicano', { validPhotos: 4, chrome: { source: 'trade', at: at(3) } }))).toBe(0);
  });
});
