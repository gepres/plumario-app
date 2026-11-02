import { Image, Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@plumario/tokens';
import { Icon, ThemedText, useTheme } from '@plumario/ui';

import { PACK_ART } from '@/constants/card-art';
import { useEconomy } from '@/hooks/use-economy';

import { PackProgress } from './pack-progress';

/** En Inicio: el sobre listo para abrir o, si no hay, cuánto falta para el próximo. */
export function PackSpot({ onOpenPack }: { onOpenPack: (packId: string) => void }) {
  const { colors } = useTheme();
  const state = useEconomy();
  if (state.status !== 'ready') return null;
  const { packs, wallet } = state.economy;
  const next = packs[0];

  if (!next) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <PackProgress observed={wallet.packSpecies.length} />
      </View>
    );
  }
  return (
    <Pressable accessibilityRole="button" onPress={() => onOpenPack(next.id)} style={[styles.card, styles.ready, { backgroundColor: colors.text, borderColor: colors.text }]}>
      <Image source={PACK_ART[next.design]} style={styles.thumb} accessibilityIgnoresInvertColors />
      <View style={styles.flex}>
        <ThemedText variant="bodyStrong" style={{ color: colors.background }}>{packs.length === 1 ? 'Tu sobre está listo' : `Tienes ${packs.length} sobres`}</ThemedText>
        <ThemedText variant="caption" style={{ color: colors.background, opacity: 0.8 }}>Ábrelo: trae una pieza de una de tus últimas aves.</ThemedText>
      </View>
      <Icon name="chevronRight" color={colors.background} size={18} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing[3],
  },
  ready: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  thumb: {
    width: 40,
    height: 69,
  },
  flex: {
    flex: 1,
  },
});
