import { describe, expect, it } from 'vitest';

import { exifDate, exifLocation } from './photo-metadata';

describe('EXIF de la foto', () => {
  it('lee la fecha en que se tomó', () => {
    expect(exifDate({ DateTimeOriginal: '2026:10:24 08:12:33' })).toEqual(new Date(2026, 9, 24, 8, 12, 33));
    expect(exifDate({})).toBeNull();
  });

  it('lee la ubicación en decimal, con el hemisferio aparte (Android)', () => {
    expect(exifLocation({ GPSLatitude: 13.84, GPSLatitudeRef: 'S', GPSLongitude: '76.25', GPSLongitudeRef: 'W' })).toEqual({ latitude: -13.84, longitude: -76.25 });
  });

  it('lee la ubicación en grados, minutos y segundos', () => {
    const location = exifLocation({ GPSLatitude: '13/1,50/1,24/1', GPSLatitudeRef: 'S', GPSLongitude: '76/1,15/1,0/1', GPSLongitudeRef: 'W' });
    expect(location?.latitude).toBeCloseTo(-13.84, 2);
    expect(location?.longitude).toBeCloseTo(-76.25, 2);
  });

  it('lee la ubicación anidada de iOS', () => {
    expect(exifLocation({ '{GPS}': { Latitude: 14.07, LatitudeRef: 'S', Longitude: 75.73, LongitudeRef: 'W' } })).toEqual({ latitude: -14.07, longitude: -75.73 });
  });

  it('sin ubicación, o con una imposible, no hay', () => {
    expect(exifLocation({})).toBeNull();
    expect(exifLocation({ GPSLatitude: 0, GPSLongitude: 0 })).toBeNull();
    expect(exifLocation({ GPSLatitude: 120, GPSLongitude: 10 })).toBeNull();
  });
});
