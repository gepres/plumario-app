import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APPEARANCES } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { Icon, ThemedText, TopBar, useTheme } from '@plumario/ui';

import { APPEARANCE_LABELS } from '@/constants/appearance';
import { useAppearance } from '@/hooks/use-appearance';

/** Perfil › Apariencia (no está en el diseño): la app clara, oscura o como el teléfono. */
export function ProfileAppearance({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [appearance, setAppearance] = useAppearance();

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Apariencia" onBack={onBack} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}>
        <View style={styles.section}>
          <ThemedText variant="section" accessibilityRole="header" style={styles.sectionTitle}>Tema</ThemedText>
          <View accessibilityRole="radiogroup" accessibilityLabel="Tema" style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {APPEARANCES.map((option, i) => {
              const selected = option === appearance;
              const { title, detail } = APPEARANCE_LABELS[option];
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${title}. ${detail}`}
                  onPress={() => setAppearance(option)}
                  style={({ pressed }) => [styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }, pressed && styles.pressed]}>
                  <View style={styles.text}>
                    <ThemedText variant="bodyStrong">{title}</ThemedText>
                    <ThemedText variant="caption" color="textSecondary">{detail}</ThemedText>
                  </View>
                  <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent' }]}>
                    {selected && <Icon name="check" color={colors.onPrimary} size={14} strokeWidth={2.6} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
        <ThemedText variant="caption" color="textSecondary" style={styles.note}>
          Se guarda en este teléfono. Los pósteres eligen su fondo aparte, al crearlos.
        </ThemedText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.cardMargin,
    gap: spacing[3],
  },
  section: {
    gap: spacing[2],
  },
  sectionTitle: {
    marginHorizontal: 4,
  },
  list: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  row: {
    minHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  note: {
    marginHorizontal: 4,
  },
});
