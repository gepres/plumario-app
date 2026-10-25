import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '@plumario/tokens';

import { useTheme } from '../theme/use-theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Lo que se lee al abrirla (el título de la hoja). */
  label: string;
  children: ReactNode;
};

/**
 * Hoja que sube desde abajo sobre un velo (AlbumSilueta). Se cierra tocando el velo o con el botón
 * Atrás de Android.
 */
export function Sheet({ visible, onClose, label, children }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={[styles.scrim, { backgroundColor: 'rgba(10,24,24,0.42)' }]} />
        <View
          accessibilityViewIsModal
          accessibilityLabel={label}
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing[6], boxShadow: '0 -12px 30px rgba(0,0,0,0.18)' }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

// Un poco más que radius.sheet, como en el diseño de la hoja.
const SHEET_RADIUS = radius.sheet + 4;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    paddingTop: 10,
    paddingHorizontal: spacing[5],
    gap: 14,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    opacity: 0.5,
  },
});
