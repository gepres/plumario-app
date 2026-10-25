// Lo que dice el EXIF de una foto: cuándo y dónde se tomó (RegistrarCamara, al elegirla de la galería).

/** La fecha en que se tomó la foto según su EXIF («2026:10:24 08:12:33»), o null si no la trae. */
export function exifDate(exif: Record<string, unknown> | null | undefined): Date | null {
  const raw = exif?.DateTimeOriginal ?? exif?.DateTime;
  if (typeof raw !== 'string') return null;
  const match = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(raw);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match.map(Number);
  const date = new Date(y!, mo! - 1, d!, h, mi, s);
  return Number.isNaN(date.getTime()) || date.getTime() > Date.now() ? null : date;
}

export type PhotoLocation = { latitude: number; longitude: number };

/** Un número del EXIF: decimal, texto decimal o grados/minutos/segundos racionales («13/1,50/1,24/1»). */
function exifNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  if (!value.includes('/')) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }
  const [d = 0, m = 0, s = 0] = value.split(',').map((part) => {
    const [num, den] = part.split('/').map(Number);
    return den ? num! / den : Number(num);
  });
  const n = d + m / 60 + s / 3600;
  return Number.isFinite(n) ? n : null;
}

/**
 * Dónde se tomó la foto según su EXIF (las de la galería suelen traerlo), o null. Solo se guarda si
 * la persona lo permite y nunca en especies amenazadas (makeRegisterSighting).
 */
export function exifLocation(exif: Record<string, unknown> | null | undefined): PhotoLocation | null {
  // En iOS viene dentro de «{GPS}»; en Android, en el primer nivel.
  const gps = (exif?.['{GPS}'] as Record<string, unknown> | undefined) ?? exif ?? {};
  const lat = exifNumber(gps.GPSLatitude ?? gps.Latitude);
  const lng = exifNumber(gps.GPSLongitude ?? gps.Longitude);
  if (lat === null || lng === null || (lat === 0 && lng === 0)) return null;
  const latitude = (gps.GPSLatitudeRef ?? gps.LatitudeRef) === 'S' ? -Math.abs(lat) : lat;
  const longitude = (gps.GPSLongitudeRef ?? gps.LongitudeRef) === 'W' ? -Math.abs(lng) : lng;
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
}
