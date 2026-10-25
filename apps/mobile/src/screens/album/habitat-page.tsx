import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { filterEntries, type AlbumEntry, type AlbumFilter, type Habitat, type HabitatSection } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { FilterChips, Icon, Medal, ProgressBar, StatusBarScrim, ThemedText, useTheme } from '@plumario/ui';

import { ALBUM_HABITAT_LABELS, HABITAT_MEDALS } from '@/constants/habitats';
import { useAlbum } from '@/hooks/use-album';

import { ShadowSheet, type PhotoSource } from './shadow-sheet';
import { GRID_SIDE, StickerCell, useStickerSize } from './sticker-grid';

type Cell = AlbumEntry | { filler: number };

type Props = {
  habitat: Habitat;
  onBack: () => void;
  onOpenSpecies: (speciesId: string) => void;
  onAddPhoto: (speciesId: string, source: PhotoSource) => void;
};

/** La página de un hábitat (design/project/HabitatLitoral.dc.html): su medalla y todos sus stickers. */
export function HabitatPage({ habitat, onBack, onOpenSpecies, onAddPhoto }: Props) {
  const state = useAlbum();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const size = useStickerSize();
  const [filter, setFilter] = useState<AlbumFilter>('all');
  const [sheet, setSheet] = useState<AlbumEntry | null>(null);
  const section = state.status === 'ready' ? state.album.habitats.find((h) => h.habitat === habitat) : undefined;
  const entries = section ? filterEntries(section.entries, filter) : [];
  // Huecos al final para que la última fila quede alineada a la izquierda.
  const cells: Cell[] = [...entries, ...Array.from({ length: (3 - (entries.length % 3)) % 3 }, (_, i) => ({ filler: i }))];

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver al álbum" onPress={onBack} style={styles.back}>
          <Icon name="back" color={colors.text} size={22} strokeWidth={2} />
        </Pressable>
        <ThemedText variant="heading" accessibilityRole="header" style={styles.title} numberOfLines={1}>
          {ALBUM_HABITAT_LABELS[habitat]}
        </ThemedText>
        {section && <ThemedText variant="label">{section.registered} de {section.total}</ThemedText>}
      </View>
      {section && (
        <>
          <MedalCard section={section} />
          <View style={styles.filters}>
            <FilterChips
              label="Filtrar especies"
              value={filter}
              onChange={setFilter}
              options={[
                { key: 'all', label: `Todas · ${section.total}` },
                { key: 'owned', label: `Tengo · ${section.registered}` },
                { key: 'missing', label: `Me faltan · ${section.total - section.registered}` },
              ]}
            />
          </View>
        </>
      )}
      {state.status === 'loading' && <ActivityIndicator style={styles.loading} />}
      {state.status === 'error' && <ThemedText color="error" style={styles.message}>No se pudo cargar el álbum. Revisa tu conexión.</ThemedText>}
      {section && entries.length === 0 && (
        <ThemedText color="textSecondary" style={styles.message}>
          {filter === 'owned' ? 'Todavía no tienes aves de este hábitat.' : '¡Ya tienes todas las aves de este hábitat!'}
        </ThemedText>
      )}
    </View>
  );

  return (
    <>
      <FlatList
        data={cells}
        keyExtractor={(cell) => ('filler' in cell ? `filler${cell.filler}` : cell.species.id)}
        numColumns={3}
        ListHeaderComponent={header}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + spacing[6] }}
        renderItem={({ item }) =>
          'filler' in item ? (
            <View style={{ width: size }} />
          ) : (
            <StickerCell entry={item} size={size} onPress={(entry) => (entry.sticker ? onOpenSpecies(entry.species.id) : setSheet(entry))} />
          )
        }
        initialNumToRender={12}
        windowSize={7}
      />
      <StatusBarScrim />
      <ShadowSheet
        entry={sheet}
        onClose={() => setSheet(null)}
        onAddPhoto={(entry, source) => {
          setSheet(null);
          onAddPhoto(entry.species.id, source);
        }}
      />
    </>
  );
}

/** «Medalla del litoral · Registra las 43 especies de playas, islas y acantilados.» */
function MedalCard({ section }: { section: HabitatSection }) {
  const { colors, shadows } = useTheme();
  const medal = HABITAT_MEDALS[section.habitat];
  const done = section.registered === section.total;
  return (
    <View style={[styles.medalCard, { backgroundColor: colors.surface, borderColor: colors.line, boxShadow: shadows.card }]}>
      <Medal kind={section.habitat} size={56} locked={!done} progress={section.total ? section.registered / section.total : 0} />
      <View style={styles.medalText}>
        <ThemedText variant="bodyStrong">{medal.title}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">
          {done ? `Ya la ganaste: tienes las ${section.total} especies.` : `Registra las ${section.total} especies de ${medal.places}.`}
        </ThemedText>
        <ProgressBar
          current={section.registered}
          total={section.total}
          valueText={`${section.registered} de ${section.total} especies`}
          size="thin"
          color={colors.habitats[section.habitat]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: spacing[3],
    paddingBottom: spacing[4],
  },
  topBar: {
    height: layout.header,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingLeft: spacing[2],
    paddingRight: layout.cardMargin,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  medalCard: {
    marginHorizontal: layout.cardMargin,
    padding: 14,
    borderWidth: 1,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  medalText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  filters: {
    marginHorizontal: layout.cardMargin,
  },
  loading: {
    marginTop: spacing[6],
  },
  message: {
    marginHorizontal: layout.cardMargin,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: GRID_SIDE,
    marginBottom: 10,
  },
});
