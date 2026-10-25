import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, spacing } from '@plumario/tokens';

import { useTheme } from '../theme/use-theme';

// Login redondea la hoja un poco más que las hojas modales (radius.sheet).
const SHEET_RADIUS = 28;

type Props = {
  /** Lo que va pegado arriba y no se desplaza (TopBar, el hero de Login). */
  header?: ReactNode;
  /** Si el encabezado ya cubre el área segura de arriba (un hero a sangre), no se suma el margen. */
  headerBleeds?: boolean;
  /** El contenido sube sobre el encabezado como una hoja de esquinas redondeadas (Login). */
  sheet?: boolean;
  children: ReactNode;
};

/**
 * Marco de las pantallas de formulario: el contenido se desplaza, el teclado no tapa el campo con
 * foco y un toque fuera de los campos no se pierde mientras el teclado está abierto.
 */
export function FormScreen({ header, headerBleeds = false, sheet = false, children }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingTop: headerBleeds ? 0 : insets.top, paddingBottom: insets.bottom + spacing[4] }]}>
        {header}
        <View style={[styles.content, sheet && [styles.sheet, { backgroundColor: colors.background }]]}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.cardMargin,
    gap: 14,
  },
  sheet: {
    marginTop: -24,
    paddingTop: spacing[6],
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
  },
});
