import { Pressable, StyleSheet, View } from 'react-native';

import { PHOTOS_FOR_CHROME, type ChromesView } from '@plumario/core';
import { radius, spacing } from '@plumario/tokens';
import { CategoryBadge, Icon, ProgressBar, ThemedText, useTheme } from '@plumario/ui';

import { SpeciesSticker } from '@/components/species-sticker';
import { CATEGORY_LABELS, formatDayMonth } from '@/constants/cards';

type Props = {
  chromes: ChromesView;
  onOpenCategories: () => void;
  onOpenSticker: (speciesId: string) => void;
  onOpenSpecies: (speciesId: string) => void;
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** El metal de cada categoría para la barra del «casi listo». */
const CATEGORY_BAR = { holographic: '#8FA9D8', silver: '#7E8B95', gold: '#B9872A', ruby: '#A51E36', diamond: '#4F93B5' } as const;

/** RecompensasStickers · Cromos: por categoría, los obtenidos y los que están por salir. */
export function Chromes({ chromes, onOpenCategories, onOpenSticker, onOpenSpecies }: Props) {
  const { colors } = useTheme();
  const { closest } = chromes;
  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tus cromos por categoría"
        onPress={onOpenCategories}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <View style={styles.sectionHead}>
          <ThemedText variant="section">Tus cromos por categoría</ThemedText>
          <Icon name="chevronRight" color={colors.text} size={18} strokeWidth={2} />
        </View>
        <View style={styles.categories}>
          {chromes.categories.map((c) => (
            <View key={c.category} style={[styles.category, { opacity: c.chromed > 0 ? 1 : 0.55 }]} accessible accessibilityLabel={`${CATEGORY_LABELS[c.category]}: ${c.chromed} de ${c.total}`}>
              <CategoryBadge category={c.category} size={32} />
              <ThemedText variant="captionStrong" numberOfLines={1}>{capitalize(CATEGORY_LABELS[c.category])}</ThemedText>
              <ThemedText variant="caption" color="textSecondary">{c.chromed}/{c.total}</ThemedText>
            </View>
          ))}
        </View>
      </Pressable>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <ThemedText variant="section" accessibilityRole="header">Obtenidos</ThemedText>
          <ThemedText variant="small" color="textSecondary">{chromes.chromed.length}</ThemedText>
        </View>
        {chromes.chromed.length === 0 ? (
          <ThemedText variant="small" color="textSecondary">Aún no te sale ninguno. Al completar un sticker hay 1 posibilidad en 8.</ThemedText>
        ) : (
          <View style={styles.grid}>
            {chromes.chromed.map((entry, i) => (
              <Pressable
                key={entry.species.id}
                accessibilityRole="button"
                accessibilityLabel={`${entry.species.commonName}, cromo ${CATEGORY_LABELS[entry.category]}`}
                onPress={() => onOpenSticker(entry.species.id)}
                style={[styles.chromed, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <SpeciesSticker entry={entry} size={64} />
                <View style={styles.flex}>
                  {i === 0 && (
                    <View style={styles.newBadge}>
                      <ThemedText variant="captionStrong" style={styles.white}>Nuevo</ThemedText>
                    </View>
                  )}
                  <ThemedText variant="label">{entry.species.commonName}</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    {capitalize(CATEGORY_LABELS[entry.category])} · {formatDayMonth(entry.sticker!.chrome!.at)}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {(closest || chromes.toTrade.length > 0) && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <ThemedText variant="section" accessibilityRole="header">Por conseguir</ThemedText>
            <ThemedText variant="small" color="textSecondary">{chromes.withoutChrome} especies sin cromo</ThemedText>
          </View>
          {closest && (
            <Pressable
              accessibilityRole="button"
              onPress={() => onOpenSpecies(closest.species.id)}
              style={[styles.closest, { backgroundColor: colors.surface, borderColor: colors.text }]}>
              <SpeciesSticker entry={closest} size={50} />
              <View style={styles.flex}>
                <ThemedText variant="eyebrow" style={{ color: CATEGORY_BAR[closest.category] }}>
                  {closest.sticker!.validPhotos >= PHOTOS_FOR_CHROME - 1 ? 'Casi listo' : 'El más cerca'} · {capitalize(CATEGORY_LABELS[closest.category])}
                </ThemedText>
                <ThemedText variant="bodyStrong">{closest.species.commonName} · por fotos</ThemedText>
                <ProgressBar
                  current={closest.sticker!.validPhotos}
                  total={PHOTOS_FOR_CHROME}
                  valueText={`${closest.sticker!.validPhotos} de ${PHOTOS_FOR_CHROME} fotos`}
                  size="thin"
                  color={CATEGORY_BAR[closest.category]}
                />
              </View>
            </Pressable>
          )}
          {chromes.toTrade.slice(0, 3).map((entry) => (
            <Pressable
              key={entry.species.id}
              accessibilityRole="button"
              onPress={() => onOpenSpecies(entry.species.id)}
              style={[styles.trade, { backgroundColor: colors.surfaceAlt }]}>
              <SpeciesSticker entry={entry} size={50} />
              <View style={styles.flex}>
                <ThemedText variant="bodyStrong">{entry.species.commonName}</ThemedText>
                <ThemedText variant="caption" color="textSecondary">{capitalize(CATEGORY_LABELS[entry.category])} · pídelo en intercambio</ThemedText>
              </View>
              <Icon name="swap" color={colors.text} size={18} strokeWidth={2} />
            </Pressable>
          ))}
        </View>
      )}

      <ThemedText variant="caption" color="textSecondary" style={styles.footnote}>
        <ThemedText variant="captionStrong">Cómo se consigue un cromo: </ThemedText>
        al completar un sticker (1 de cada 8), con {PHOTOS_FOR_CHROME} fotos validadas o intercambiando por uno de igual o mayor categoría.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 14,
  },
  section: {
    gap: spacing[2],
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: 14,
    paddingVertical: spacing[3],
    gap: 10,
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  category: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chromed: {
    width: '48.5%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  newBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#A0541F',
  },
  white: {
    color: '#FFFFFF',
  },
  closest: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: spacing[2],
    paddingLeft: 10,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  trade: {
    borderRadius: 16,
    paddingVertical: spacing[2],
    paddingLeft: spacing[3],
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  footnote: {
    paddingHorizontal: 4,
  },
});
