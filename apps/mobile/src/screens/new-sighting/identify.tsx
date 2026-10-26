import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IdentifierError, formatAlbumNumber, searchEntries, type AlbumEntry, type Suggestion } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, Icon, Sheet, TextLink, ThemedText, TopBar, textStyles, useTheme } from '@plumario/ui';

import { SuggestionsSkeleton } from '@/components/screen-skeletons';
import { SpeciesSticker } from '@/components/species-sticker';
import { formatShortDate } from '@/constants/cards';
import { useAlbum } from '@/hooks/use-album';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  photoUri: string;
  takenAt: Date;
  onBack: () => void;
  onChoose: (speciesId: string) => void;
};

const TAGS = ['Más probable', 'Posible', 'Posible'];

// Cuando la IA no sugiere nada: no vio un ave, no respondió o ya se usaron las consultas del día.
const NOTICES = {
  none: 'La IA no reconoció un ave en tu foto. Si sabes cuál es, búscala en el álbum.',
  unavailable: 'No pudimos consultar a la IA. Revisa tu conexión o busca la especie en el álbum.',
  quota: 'Ya usaste las consultas a la IA de hoy. Busca la especie en el álbum.',
} as const;

/** RegistrarIdentificar: la IA sugiere especies para la foto y se elige el sticker. */
export function Identify({ photoUri, takenAt, onBack, onChoose }: Props) {
  const { useCases } = useDependencies();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const state = useAlbum();
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [failure, setFailure] = useState<IdentifierError['reason'] | null>(null);
  const [selected, setSelected] = useState<AlbumEntry | null>(null);
  const [manual, setManual] = useState<AlbumEntry | null>(null);
  const [picking, setPicking] = useState(false);
  const album = state.status === 'ready' ? state.album : null;

  useEffect(() => {
    if (!album) return;
    let current = true;
    useCases
      .suggestSpecies(photoUri, album)
      .then((found) => {
        if (!current) return;
        setSuggestions(found);
        setSelected((prev) => prev ?? found[0]?.entry ?? null);
      })
      .catch((error: unknown) => {
        if (!current) return;
        setFailure(error instanceof IdentifierError ? error.reason : 'unavailable');
        setSuggestions([]);
      });
    return () => {
      current = false;
    };
  }, [useCases, photoUri, album]);

  // La especie elegida a mano se suma arriba de las sugerencias.
  const options: { entry: AlbumEntry; tag: string }[] = [
    ...(manual ? [{ entry: manual, tag: 'Elegida por ti' }] : []),
    ...(suggestions ?? []).filter((s) => s.entry.species.id !== manual?.species.id).map((s, i) => ({ entry: s.entry, tag: TAGS[i] ?? 'Posible' })),
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="¿Qué ave es?" onBack={onBack} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: spacing[4] }]}>
        <View style={styles.photo}>
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Tu foto" />
          <View style={styles.dateChip}>
            <ThemedText variant="captionStrong" style={styles.dateText}>Tu foto · {formatShortDate(takenAt)}</ThemedText>
          </View>
        </View>

        <View style={styles.heading}>
          <ThemedText variant="section">La IA sugiere</ThemedText>
          <ThemedText variant="caption" color="textSecondary">Toca el sticker que corresponde a tu foto.</ThemedText>
        </View>

        {!suggestions && (
          <View style={styles.options}>
            <SuggestionsSkeleton />
          </View>
        )}
        {suggestions?.length === 0 && (
          <ThemedText variant="small" color="textSecondary" accessibilityLiveRegion="polite" style={styles.notice}>
            {NOTICES[failure ?? 'none']}
          </ThemedText>
        )}
        <View accessibilityRole="radiogroup" accessibilityLabel="Especies sugeridas" style={styles.options}>
          {options.map(({ entry, tag }, i) => {
            const checked = entry.species.id === selected?.species.id;
            return (
              <Pressable
                key={entry.species.id}
                accessibilityRole="radio"
                accessibilityState={{ checked }}
                accessibilityLabel={`${entry.species.commonName}, ${entry.sticker ? 'ya está en tu álbum' : 'sticker vacío'}, ${tag}`}
                onPress={() => setSelected(entry)}
                style={[
                  styles.option,
                  checked ? { borderColor: colors.text, borderWidth: 2, backgroundColor: colors.surface } : { borderColor: colors.line, borderWidth: 1 },
                ]}>
                <SpeciesSticker entry={entry} size={58} />
                <View style={styles.optionText}>
                  <ThemedText variant="bodyStrong">{entry.species.commonName}</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    N.º {formatAlbumNumber(entry.species.albumNumber)} · {entry.sticker ? 'Ya está en tu álbum' : 'Sticker vacío'}
                  </ThemedText>
                  <View style={[styles.tag, i === 0 && !manual ? { backgroundColor: colors.primary } : { backgroundColor: colors.surfaceAlt }]}>
                    <ThemedText variant="captionStrong" style={{ color: i === 0 && !manual ? colors.onPrimary : colors.text }}>
                      {entry.sticker ? 'Irá a su galería' : tag}
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.dot, { borderColor: checked ? colors.text : colors.border, borderWidth: checked ? 7 : 2 }]} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.searchLink}>
          <Icon name="search" color={colors.primary} size={18} strokeWidth={2} />
          <TextLink label="No es ninguna: buscar en el álbum" onPress={() => setPicking(true)} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
        <Button
          label={selected ? (selected.sticker ? `Agregar a la galería de ${selected.species.commonName}` : `Colocar en ${selected.species.commonName}`) : 'Elige una especie'}
          disabled={!selected}
          onPress={() => selected && onChoose(selected.species.id)}
        />
      </View>

      {album && (
        <SpeciesPicker
          visible={picking}
          entries={album.entries}
          onClose={() => setPicking(false)}
          onPick={(entry) => {
            setManual(entry);
            setSelected(entry);
            setPicking(false);
          }}
        />
      )}
    </View>
  );
}

/** Elegir la especie a mano cuando la IA no acierta («Si la IA no reconoce la especie…»). */
function SpeciesPicker({ visible, entries, onClose, onPick }: { visible: boolean; entries: readonly AlbumEntry[]; onClose: () => void; onPick: (entry: AlbumEntry) => void }) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const results = searchEntries(entries, query).slice(0, 40);
  return (
    <Sheet visible={visible} onClose={onClose} label="Buscar el ave en el álbum">
      <ThemedText variant="heading">Buscar en el álbum</ThemedText>
      <View style={[styles.search, { backgroundColor: colors.field, borderColor: colors.border }]}>
        <Icon name="search" color={colors.textSecondary} size={18} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Nombre común, científico o número"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="Buscar un ave"
          autoCorrect={false}
          autoFocus
          selectionColor={colors.primary}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(entry) => entry.species.id}
        style={styles.results}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => onPick(item)} style={[styles.result, { borderBottomColor: colors.line }]}>
            <SpeciesSticker entry={item} size={40} />
            <View style={styles.optionText}>
              <ThemedText variant="bodyStrong">{item.species.commonName}</ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                N.º {formatAlbumNumber(item.species.albumNumber)} · {item.species.scientificName}
              </ThemedText>
            </View>
          </Pressable>
        )}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: spacing[3],
  },
  photo: {
    marginHorizontal: layout.cardMargin,
    height: 196,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#93B1BA',
  },
  dateChip: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(11,20,20,0.55)',
  },
  dateText: {
    color: '#FFFFFF',
  },
  heading: {
    marginHorizontal: layout.textMargin,
    marginTop: spacing[1],
    gap: 2,
  },
  notice: {
    marginHorizontal: layout.textMargin,
  },
  options: {
    marginHorizontal: layout.cardMargin,
    gap: spacing[2],
  },
  option: {
    minHeight: 92,
    borderRadius: 16,
    paddingVertical: spacing[2],
    paddingLeft: 10,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  searchLink: {
    marginHorizontal: layout.textMargin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  footer: {
    paddingHorizontal: layout.cardMargin,
    paddingTop: spacing[2],
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
  results: {
    maxHeight: 360,
  },
  result: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
});
