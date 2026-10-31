import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, spacing } from '@plumario/tokens';
import { Button, Icon, ThemedText, TopBar, useTheme } from '@plumario/ui';

/** IntercambioPausa: el intercambio vuelve en la fase 2B, con sus reglas nuevas. */
export function TradePaused({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom + spacing[4] }]}>
      <TopBar title="Intercambio" onBack={onBack} />
      <View style={styles.body}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
          <Icon name="swap" color={colors.text} size={30} strokeWidth={1.8} />
        </View>
        <ThemedText variant="heading" accessibilityRole="header" style={styles.center}>Vuelve pronto con plumas</ThemedText>
        <ThemedText color="textSecondary" style={styles.center}>
          Estamos preparando un intercambio en el que tu álbum no pierde nada. Mientras tanto, sigue observando.
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <Button label="Volver" onPress={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: layout.textMargin,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: layout.cardMargin,
  },
});
