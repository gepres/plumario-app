import { Pressable, StyleSheet, View } from 'react-native';

import { lastUnlocked, nextFinishMilestone, type ChromesView } from '@plumario/core';
import { radius, spacing } from '@plumario/tokens';
import { CategoryBadge, Icon, ProgressBar, ThemedText, useTheme } from '@plumario/ui';

import { SpeciesSticker } from '@/components/species-sticker';
import { CATEGORY_LABELS, finishTitle, formatDayMonth } from '@/constants/cards';

type Props = {
  chromes: ChromesView;
  onOpenCategories: () => void;
  onOpenSticker: (speciesId: string) => void;
  onOpenSpecies: (speciesId: string) => void;
};

/** El metal de cada acabado para la barra del «casi listo». */
const CATEGORY_BAR = { holographic: '#8FA9D8', silver: '#7E8B95', gold: '#B9872A', ruby: '#A51E36', diamond: '#4F93B5' } as const;

/** RecompensasStickers · Cromos: por acabado, los obtenidos y los que están por salir. */
export function Chromes({ chromes, onOpenCategories, onOpenSticker, onOpenSpecies }: Props) {
  const { colors } = useTheme();
  const { closest } = chromes;
  const next = closest && nextFinishMilestone(closest.sticker!.observations);
  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tus acabados"
        onPress={onOpenCategories}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <View style={styles.sectionHead}>
          <ThemedText variant="section">Tus acabados</ThemedText>
          <Icon name="chevronRight" color={colors.text} size={18} strokeWidth={2} />
        </View>
        <View style={styles.categories}>
          {chromes.ladder.map((step) => (
            <View key={step.finish} style={[styles.category, { opacity: step.reached > 0 ? 1 : 0.55 }]} accessible accessibilityLabel={`${CATEGORY_LABELS[step.finish]}: ${step.reached} de ${step.registered}`}>
              <CategoryBadge category={step.finish} size={32} />
              <ThemedText variant="captionStrong" numberOfLines={1}>{finishTitle(step.finish)}</ThemedText>
              <ThemedText variant="caption" color="textSecondary">{step.reached}/{step.registered}</ThemedText>
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
          <ThemedText variant="small" color="textSecondary">Aún no tienes ninguno. Tu primera foto de cada especie tiene 1 posibilidad en 8.</ThemedText>
        ) : (
          <View style={styles.grid}>
            {chromes.chromed.map((entry, i) => (
              <Pressable
                key={entry.species.id}
                accessibilityRole="button"
                accessibilityLabel={`${entry.species.commonName}, cromo ${CATEGORY_LABELS[entry.finish!]}`}
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
                    {finishTitle(entry.finish!)} · {formatDayMonth(lastUnlocked(entry.sticker!)!.at)}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {closest && next && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <ThemedText variant="section" accessibilityRole="header">Por conseguir</ThemedText>
            <ThemedText variant="small" color="textSecondary">{chromes.withoutChrome} especies sin cromo</ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenSpecies(closest.species.id)}
            style={[styles.closest, { backgroundColor: colors.surface, borderColor: colors.text }]}>
            <SpeciesSticker entry={closest} size={50} />
            <View style={styles.flex}>
              <ThemedText variant="eyebrow" style={{ color: CATEGORY_BAR[next.finish] }}>
                {next.observations - closest.sticker!.observations === 1 ? 'Casi listo' : 'El más cerca'} · {finishTitle(next.finish)}
              </ThemedText>
              <ThemedText variant="bodyStrong">{closest.species.commonName}</ThemedText>
              <ProgressBar
                current={closest.sticker!.observations}
                total={next.observations}
                valueText={`${closest.sticker!.observations} de ${next.observations} observaciones`}
                size="thin"
                color={CATEGORY_BAR[next.finish]}
              />
            </View>
          </Pressable>
        </View>
      )}

      <ThemedText variant="caption" color="textSecondary" style={styles.footnote}>
        <ThemedText variant="captionStrong">Cómo se gana un cromo: </ThemedText>
        observando la misma especie en días distintos. Con 3, 5, 10, 20 y 35 observaciones ganas cada acabado.
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
  footnote: {
    paddingHorizontal: 4,
  },
});
