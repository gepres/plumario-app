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
