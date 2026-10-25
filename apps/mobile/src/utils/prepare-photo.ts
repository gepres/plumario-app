import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

/** Lado mayor con que se guarda la foto: nítida en la galería y liviana para subirla sin señal buena. */
const MAX_SIDE = 1600;

/**
 * Deja la foto lista para subir: JPEG y, si es más grande, con el lado mayor en 1600 px. Se guarda
 * completa, sin recortes (RegistrarColocar: «Tu foto, completa»).
 */
export async function preparePhoto(photo: { uri: string; width: number; height: number }): Promise<string> {
  if (Platform.OS === 'web') return photo.uri;
  const context = ImageManipulator.manipulate(photo.uri);
  if (Math.max(photo.width, photo.height) > MAX_SIDE) {
    context.resize(photo.width >= photo.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.82, format: SaveFormat.JPEG });
  return saved.uri;
}

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
