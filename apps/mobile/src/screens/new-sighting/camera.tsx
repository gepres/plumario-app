import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { spacing } from '@plumario/tokens';
import { Button, Icon, ThemedText } from '@plumario/ui';

import { exifDate, preparePhoto } from '@/utils/prepare-photo';

export type TakenPhoto = { uri: string; takenAt: Date };

type Props = {
  /** Si se llegó desde un sticker vacío del álbum, su nombre (la foto ya tiene especie). */
  speciesName?: string;
  /** «De la galería» desde el álbum: se abre la galería directamente. */
  startWithGallery?: boolean;
  onClose: () => void;
  onFromAlbum: () => void;
  onPhoto: (photo: TakenPhoto) => void;
};

// La cámara siempre es oscura, como en el diseño, sea cual sea el modo del teléfono.
const INK = '#F3EDE2';
const NIGHT = '#0B1414';
const SUN = '#E4C766';
const GALLERY: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: true };

/** RegistrarCamara: tomar la foto del ave o elegirla de la galería. */
export function Camera({ speciesName, startWithGallery = false, onClose, onFromAlbum, onPhoto }: Props) {
  const insets = useSafeAreaInsets();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish(photo: { uri: string; width: number; height: number }, takenAt: Date) {
    setBusy(true);
    try {
      onPhoto({ uri: await preparePhoto(photo), takenAt });
    } catch {
      setError('No se pudo preparar la foto. Prueba de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function shoot() {
    if (busy || !camera.current) return;
    setError(null);
    const picture = await camera.current.takePictureAsync({ quality: 0.9 }).catch(() => null);
    if (picture) await finish(picture, new Date());
    else setError('No se pudo tomar la foto. Prueba de nuevo.');
  }

  async function handleGalleryResult(result: ImagePicker.ImagePickerResult) {
    setError(null);
    if (result.canceled || !result.assets[0]) {
      if (startWithGallery) onClose();
      return;
    }
    const asset = result.assets[0];
    await finish(asset, exifDate(asset.exif) ?? new Date());
  }

  const pickFromGallery = () => ImagePicker.launchImageLibraryAsync(GALLERY).then(handleGalleryResult);

  // Desde el álbum, «De la galería» abre la galería sin pasar por la cámara.
  useEffect(() => {
    if (!startWithGallery) return;
    let active = true;
    void ImagePicker.launchImageLibraryAsync(GALLERY).then((result) => {
      if (active) void handleGalleryResult(result);
    });
    return () => {
      active = false;
    };
    // Solo al abrir la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const granted = permission?.granted ?? false;

  return (
    <View style={[styles.root, { backgroundColor: NIGHT }]}>
      <StatusBar style="light" />
      {granted && !startWithGallery ? (
        <CameraView ref={camera} style={styles.viewfinder} facing="back" enableTorch={torch} />
      ) : (
        <View style={[styles.viewfinder, styles.placeholder]}>
          {!startWithGallery && permission && (
            <View style={styles.permission}>
              <Icon name="camera" color={INK} size={40} strokeWidth={1.6} />
              <ThemedText variant="heading" style={{ color: INK, textAlign: 'center' }}>Para fotografiar aves, Plumario necesita la cámara</ThemedText>
              <ThemedText variant="small" style={{ color: 'rgba(243,237,226,0.75)', textAlign: 'center' }}>
                También puedes elegir una foto que ya tengas en tu galería.
              </ThemedText>
              {permission.canAskAgain ? (
                <Button label="Permitir la cámara" variant="light" onPress={() => void requestPermission()} />
              ) : (
                <ThemedText variant="small" style={{ color: INK, textAlign: 'center' }}>Actívala en los ajustes del teléfono para Plumario.</ThemedText>
              )}
            </View>
          )}
        </View>
      )}

      {granted && !startWithGallery && (
        <Svg width={236} height={236} viewBox="0 0 236 236" style={styles.frame} pointerEvents="none">
          <Path d="M2 36 V2 H36 M200 2 H234 V36 M234 200 V234 H200 M36 234 H2 V200" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}

      <View style={[styles.header, { top: insets.top + spacing[2] }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={styles.round}>
          <Icon name="close" color={INK} size={22} strokeWidth={2} />
        </Pressable>
        <View style={styles.titlePill}>
          <ThemedText variant="label" style={{ color: INK }}>{speciesName ? `Foto para ${speciesName}` : 'Registrar ave'}</ThemedText>
        </View>
        {granted && !startWithGallery ? (
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Linterna"
            accessibilityState={{ checked: torch }}
            onPress={() => setTorch(!torch)}
            style={[styles.round, torch && { backgroundColor: SUN }]}>
            <Icon name="flash" color={torch ? NIGHT : INK} size={20} />
          </Pressable>
        ) : (
          <View style={styles.roundSpacer} />
        )}
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.hint}>
          <ThemedText variant="captionStrong" style={{ color: INK, textAlign: 'center' }}>
            {error ?? (speciesName ? 'Toma la foto; la IA revisa que sea esta especie' : 'Toma la foto; luego la IA te ayuda a identificarla')}
          </ThemedText>
        </View>
        <ThemedText variant="eyebrow" style={{ color: SUN, textAlign: 'center' }}>Foto</ThemedText>
        <View style={styles.buttons}>
          <Pressable accessibilityRole="button" accessibilityLabel="Elegir de la galería" onPress={() => void pickFromGallery()} style={styles.side}>
            <View style={styles.sideIcon}>
              <Icon name="image" color={INK} size={24} strokeWidth={1.8} />
            </View>
            <ThemedText variant="caption" style={{ color: INK }}>Galería</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tomar foto"
            accessibilityState={{ disabled: !granted || busy }}
            disabled={!granted || busy || startWithGallery}
            onPress={() => void shoot()}
            style={[styles.shutter, (!granted || startWithGallery) && styles.dim]}>
            {busy ? <ActivityIndicator color={NIGHT} /> : <View style={styles.shutterDot} />}
          </Pressable>
          {speciesName ? (
            <View style={styles.side} />
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel="Elegir la especie desde el álbum" onPress={onFromAlbum} style={styles.side}>
              <View style={styles.sideIcon}>
                <Icon name="album" color={INK} size={24} strokeWidth={1.8} />
              </View>
              <ThemedText variant="caption" style={{ color: INK }}>Desde el álbum</ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  viewfinder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 192,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  permission: {
    alignItems: 'center',
    gap: spacing[3],
    maxWidth: 320,
  },
  frame: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
  },
  header: {
    position: 'absolute',
    left: spacing[2],
    right: spacing[2],
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(11,20,20,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundSpacer: {
    width: 44,
  },
  titlePill: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(11,20,20,0.45)',
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 28,
    gap: 18,
  },
  hint: {
    alignSelf: 'center',
    marginBottom: 2,
    paddingHorizontal: 14,
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: 'rgba(11,20,20,0.6)',
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    width: 96,
    alignItems: 'center',
    gap: 6,
  },
  sideIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(243,237,226,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDot: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: INK,
  },
  dim: {
    opacity: 0.4,
  },
});
