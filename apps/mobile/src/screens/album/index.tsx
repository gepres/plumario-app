import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { searchEntries, type AlbumEntry, type AlbumView, type Habitat } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, Icon, StatusBarScrim, ThemedText, textStyles, useTheme } from '@plumario/ui';

import { useAlbum } from '@/hooks/use-album';

import { HabitatCard } from './habitat-card';
import { ShadowSheet, type PhotoSource } from './shadow-sheet';
import { StickerGrid } from './sticker-grid';

type Props = {
  onOpenHabitat: (habitat: Habitat) => void;
  onOpenSpecies: (speciesId: string) => void;
  onAddPhoto: (speciesId: string, source: PhotoSource) => void;
  /** Llega desde «Buscar» de Inicio: el buscador abre con el teclado. Cambia cada vez que se pide. */
  focusSearch?: string;
};

/** Álbum (design/project/Album.dc.html): avance total, buscador y una tarjeta por hábitat. */
export function Album(props: Props) {
  const state = useAlbum();
  const insets = useSafeAreaInsets();
  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4], paddingBottom: layout.tabBar + insets.bottom + spacing[4] }]}>
        {state.status === 'loading' && <ActivityIndicator style={styles.loading} />}
        {state.status === 'error' && (
          <View style={styles.error}>
            <ThemedText color="error">No se pudo cargar tu álbum. Revisa tu conexión.</ThemedText>
            <Button label="Reintentar" variant="secondary" onPress={state.refresh} />
          </View>
        )}
        {state.status === 'ready' && <AlbumContent album={state.album} {...props} />}
      </ScrollView>
      <StatusBarScrim />
    </>
  );
}

function AlbumContent({ album, onOpenHabitat, onOpenSpecies, onAddPhoto, focusSearch }: Props & { album: AlbumView }) {
  const { colors } = useTheme();
  const searchRef = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (!focusSearch) return;
    // Después de la transición de pestaña: antes, Android no abre el teclado.
    const timer = setTimeout(() => searchRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [focusSearch]);
  const [query, setQuery] = useState('');
  const [sheet, setSheet] = useState<AlbumEntry | null>(null);
  const results = query.trim() ? searchEntries(album.entries, query) : null;

  const open = (entry: AlbumEntry) => (entry.sticker ? onOpenSpecies(entry.species.id) : setSheet(entry));

  return (
    <>
      <View style={styles.header}>
        <View style={styles.titles}>
          <ThemedText variant="title" accessibilityRole="header">Álbum</ThemedText>
          <ThemedText variant="caption" color="textSecondary">Toca una silueta para completarla con tu foto</ThemedText>
        </View>
        <View style={styles.total} accessible accessibilityLabel={`${album.registered} de ${album.total} especies`}>
          <ThemedText variant="heading" style={styles.totalNumber}>{album.registered}</ThemedText>
          <ThemedText variant="caption" color="textSecondary">de {album.total}</ThemedText>
        </View>
      </View>

      <View style={[styles.search, { backgroundColor: colors.field, borderColor: colors.border }]}>
        <Icon name="search" color={colors.textSecondary} size={18} strokeWidth={2} />
        <TextInput
          ref={searchRef}
          value={query}
          onChangeText={setQuery}
          placeholder={`Buscar entre ${album.total} aves`}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="Buscar un ave"
          autoCorrect={false}
          returnKeyType="search"
          selectionColor={colors.primary}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {results ? (
        results.length ? (
          <StickerGrid entries={results.slice(0, 60)} onPress={open} />
        ) : (
          <ThemedText color="textSecondary" style={styles.noResults}>No hay aves con «{query.trim()}».</ThemedText>
        )
      ) : (
        <View style={styles.habitats}>
          {album.habitats
            .filter((section) => section.total > 0)
            .map((section) => (
              <HabitatCard key={section.habitat} section={section} onPress={() => onOpenHabitat(section.habitat)} />
            ))}
        </View>
      )}

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

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.cardMargin,
    gap: spacing[3],
  },
  loading: {
    marginTop: spacing[6],
  },
  error: {
    gap: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingHorizontal: 4,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    paddingTop: 6,
  },
  totalNumber: {
    fontFamily: textStyles.title.fontFamily,
    fontSize: 22,
  },
  search: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    ...textStyles.body,
    flex: 1,
    minHeight: 44,
    paddingVertical: 0,
  },
  habitats: {
    gap: 9,
  },
  noResults: {
    paddingHorizontal: 4,
  },
});
