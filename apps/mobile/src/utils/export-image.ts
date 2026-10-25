import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { shareAsync } from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

// Exportar lo que se dibuja en la app (pósteres, tarjetas para compartir): capturar una vista como
// imagen, guardarla en las fotos del teléfono y compartirla.

/** Lo que se captura: la referencia a la vista que dibuja la pieza en alta. */
export type CaptureTarget = Parameters<typeof captureRef>[0];

/** «Póster 1 · Mis aves de Ica» → «plumario-poster-1-mis-aves-de-ica», para nombrar los archivos. */
export function exportFileName(caption: string): string {
  const slug = caption.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `plumario-${slug || 'imagen'}`;
}

/** La vista como archivo PNG temporal, justo del tamaño pedido en píxeles. */
export function captureImage(view: CaptureTarget, { width, height, caption }: { width: number; height: number; caption: string }): Promise<string> {
  return captureRef(view, { format: 'png', quality: 1, result: 'tmpfile', fileName: exportFileName(caption), width, height });
}

/** Guarda la imagen en las fotos del teléfono (pide permiso la primera vez). */
export async function saveImageToPhotos(uri: string): Promise<boolean> {
  const permission = await requestPermissionsAsync(true);
  if (!permission.granted) return false;
  await Asset.create(uri);
  return true;
}

const UTIS = { 'image/png': 'public.png', 'application/pdf': 'com.adobe.pdf', 'application/json': 'public.json' } as const;

export function shareFile(uri: string, mimeType: keyof typeof UTIS, title: string) {
  return shareAsync(uri, { mimeType, dialogTitle: title, UTI: UTIS[mimeType] });
}
