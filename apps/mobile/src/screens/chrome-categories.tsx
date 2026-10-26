import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chromesView, type AlbumEntry, type CardCategory } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, InfoNote, ProgressBar, ThemedText, TopBar, useTheme } from '@plumario/ui';

import { ListSkeleton } from '@/components/screen-skeletons';
import { SpeciesSticker } from '@/components/species-sticker';
import { CATEGORY_LABELS } from '@/constants/cards';
import { useAlbum } from '@/hooks/use-album';

const CRITERIA: Record<CardCategory, string> = {
  holographic: 'Especies comunes',
  silver: 'Casi amenazadas',
  gold: 'Endémicas del Perú',
  ruby: 'Emblemáticas de Ica y del Perú',
  diamond: 'Amenazadas',
};

const BAR: Record<CardCategory, string> = { holographic: '#8FA9D8', silver: '#8F9BA4', gold: '#D9A93E', ruby: '#A51E36', diamond: '#16324A' };

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** «Lo tuyo» de cada categoría: qué cromos tienes y cuál está más cerca. */
function yours(entries: readonly AlbumEntry[]): string {
  const chromed = entries.filter((e) => e.sticker?.chrome);
  const registered = entries.filter((e) => e.sticker);
  if (chromed.length) {
    const names = chromed.slice(0, 2).map((e) => e.species.commonName).join(' y ');
    return `${names}${chromed.length > 2 ? ` y ${chromed.length - 2} más` : ''}. Registraste ${registered.length} de esta categoría.`;
  }
  if (registered.length) {
    const best = [...registered].sort((a, b) => b.sticker!.validPhotos - a.sticker!.validPhotos)[0]!;
    return `Tienes ${registered.length} sin cromo. La más cerca: ${best.species.commonName}, con ${best.sticker!.validPhotos} de 5 fotos.`;
  }
  return 'Aún no registras especies de esta categoría.';
}

/** CromosCategorias: qué especies son de cada categoría y cuántas tienes en cromo. */
export function ChromeCategories({ onBack }: { onBack: () => void }) {
  const state = useAlbum();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const album = state.status === 'ready' ? state.album : null;
  const view = album ? chromesView(album) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Categorías de cromos" onBack={onBack} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[4] }]}>
        <ThemedText variant="small" color="textSecondary" style={styles.intro}>
          Cada especie tiene una categoría. Si su cromo sale, sale con ese acabado.
        </ThemedText>
        {!view && <ListSkeleton rows={5} />}
        {view &&
          album &&
          view.categories.map((c) => {
            const entries = album.entries.filter((e) => e.category === c.category);
            // De muestra, una que ya tenga en cromo; si no, la primera de la categoría, cromada para ver el acabado.
            const sample = entries.find((e) => e.sticker?.chrome) ?? entries[0];
            const preview = sample && {
              ...sample,
              sticker: sample.sticker?.chrome ? sample.sticker : { speciesId: sample.species.id, completedAt: new Date(), validPhotos: 1, chrome: { source: 'luck' as const, at: new Date() } },
            };
            return (
              <View key={c.category} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                {preview && (
                  <View style={{ opacity: c.chromed > 0 ? 1 : 0.5 }}>
                    <SpeciesSticker entry={preview} size={60} />
                  </View>
                )}
                <View style={styles.flex}>
                  <View style={styles.rowHead}>
                    <ThemedText variant="section">{capitalize(CATEGORY_LABELS[c.category])}</ThemedText>
                    <ThemedText variant="label">{c.chromed} de {c.total}</ThemedText>
                  </View>
                  <ThemedText variant="caption" color="textSecondary">{CRITERIA[c.category]}</ThemedText>
                  <ProgressBar current={c.chromed} total={Math.max(c.total, 1)} showValue={false} size="thin" color={BAR[c.category]} />
                  <ThemedText variant="caption">{yours(entries)}</ThemedText>
                </View>
              </View>
            );
          })}
        <InfoNote>
          <ThemedText variant="caption" color="textSecondary">
            Todas tienen la misma probabilidad de salir en cromo: 1 de cada 8 al completar. Si una especie cumple varias categorías, se queda con la más alta.
          </ThemedText>
        </InfoNote>
        <Button label="Listo" onPress={onBack} />
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
    gap: spacing[2],
  },
  intro: {
    marginHorizontal: 4,
    marginBottom: 6,
  },
  row: {
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: spacing[1],
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
});
