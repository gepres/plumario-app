import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, spacing } from '@plumario/tokens';

import { ThemedText } from './themed-text';

type Props = {
  /** Antetítulo de las pestañas principales («Álbum de aves · Edición inicial»). */
  eyebrow?: string;
  title: string;
  /** Deja sitio abajo para la barra flotante de las pestañas. */
  withTabBar?: boolean;
  children?: ReactNode;
};

/** Marco de una pantalla: el encabezado del diseño (antetítulo y título de 27) y contenido desplazable. */
export function Screen({ eyebrow, title, withTabBar = true, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing[4], paddingBottom: (withTabBar ? layout.tabBar : 0) + insets.bottom + spacing[4] },
      ]}>
      {eyebrow && <ThemedText variant="eyebrow" color="primary">{eyebrow}</ThemedText>}
      <ThemedText variant="title" accessibilityRole="header">{title}</ThemedText>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.cardMargin,
    gap: spacing[3],
  },
});
