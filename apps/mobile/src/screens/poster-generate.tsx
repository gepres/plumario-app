import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { POSTER_TITLE_MAX, posterSpecies, SPECIES_PER_POSTER, type PosterTheme } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, Icon, PosterFrame, SpeciesPoster, ThemedText, ToggleGroup, TopBar, textStyles, useTheme } from '@plumario/ui';

import { DEFAULT_POSTER_TITLE, speciesPosterProps } from '@/components/poster-content';
import { invalidatePosters } from '@/hooks/posters-version';
import { useAlbum } from '@/hooks/use-album';
import { useCollectorName } from '@/hooks/use-profile';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  number: number;
  onBack: () => void;
  onSaved: (posterId: string) => void;
};

/** PosterGenerar: el póster de cada 10 se mezcla, se elige el fondo y el título, y se guarda. */
export function PosterGenerate({ number, onBack, onSaved }: Props) {
  const { useCases } = useDependencies();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useSession()?.uid;
  const state = useAlbum();
  const collector = useCollectorName();
  const [seed, setSeed] = useState(7);
  const [shuffles, setShuffles] = useState(0);
  const [theme, setTheme] = useState<PosterTheme>('light');
  const [title, setTitle] = useState(DEFAULT_POSTER_TITLE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const album = state.status === 'ready' ? state.album : null;
  const ready = !!album && album.registered >= number * SPECIES_PER_POSTER;

  async function save() {
    if (!album || !userId) return;
    setSaving(true);
    setError(null);
    try {
      const speciesIds = posterSpecies(album.entries, number, seed);
      const id = await useCases.savePoster(userId, { kind: 'species', number, habitat: null, speciesIds, seed, theme, title });
      invalidatePosters();
      onSaved(id);
    } catch {
      setError('No se pudo guardar el póster. Revisa tu conexión y vuelve a intentar.');
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title={`Tu póster ${number}`} onBack={onBack} />
      {!album && <ActivityIndicator style={styles.loading} />}
      {album && !ready && (
        <ThemedText color="textSecondary" style={styles.message}>
          Este póster se arma al llegar a {number * SPECIES_PER_POSTER} especies. Tienes {album.registered}.
        </ThemedText>
      )}
      {album && ready && (
        <>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <ThemedText variant="small" color="textSecondary" style={styles.intro}>
              {number === 1
                ? 'Se arma con tus 10 primeras especies. Mézclalo hasta que te guste y guárdalo.'
                : 'Se arma con 10 de tus especies al azar, con al menos una de cada hábitat. Mézclalo hasta que te guste y guárdalo.'}
            </ThemedText>
            <View style={[styles.stage, { backgroundColor: colors.surfaceAlt }]}>
              <PosterFrame width={232} style={styles.poster}>
                <SpeciesPoster {...speciesPosterProps(album, { number, seed, theme, title }, collector)} />
              </PosterFrame>
            </View>
            <View style={[styles.controls, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <View style={styles.row}>
                <View>
                  <ThemedText variant="bodyStrong">Orden</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">Mezclas: {shuffles === 0 ? 'ninguna' : shuffles}</ThemedText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setSeed((s) => (s * 31 + 17) % 9973 || 3);
                    setShuffles((n) => n + 1);
                  }}
                  style={[styles.shuffle, { borderColor: colors.text }]}>
                  <Icon name="shuffle" color={colors.text} size={18} strokeWidth={2} />
                  <ThemedText variant="label">Mezclar</ThemedText>
                </Pressable>
              </View>
              <View style={styles.row}>
                <ThemedText variant="bodyStrong">Fondo</ThemedText>
                <ToggleGroup label="Fondo" value={theme} onChange={setTheme} options={[{ key: 'light', label: 'Claro' }, { key: 'dark', label: 'Oscuro' }]} />
              </View>
              <View style={styles.row}>
                <ThemedText variant="bodyStrong">Título</ThemedText>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  maxLength={POSTER_TITLE_MAX}
                  accessibilityLabel="Título del póster"
                  selectionColor={colors.primary}
                  style={[styles.title, { borderColor: colors.border, backgroundColor: colors.field, color: colors.text }]}
                />
              </View>
            </View>
            <ThemedText variant="caption" color="textSecondary" style={styles.intro}>
              Al guardarlo queda fijo como Póster {number}. Lo puedes descargar o compartir cuando quieras.
            </ThemedText>
            {error && <ThemedText variant="small" color="error" style={styles.intro}>{error}</ThemedText>}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
            <Button label="Guardar póster" onPress={() => void save()} busy={saving} disabled={!title.trim()} />
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    marginTop: spacing[6],
  },
  message: {
    marginHorizontal: layout.textMargin,
  },
  content: {
    gap: 10,
    paddingBottom: spacing[4],
  },
  intro: {
    marginHorizontal: layout.textMargin,
  },
  stage: {
    marginHorizontal: layout.cardMargin,
    height: 352,
    borderRadius: radius.hero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poster: {
    borderRadius: 3,
    boxShadow: '0 2px 4px rgba(20,48,47,0.2), 0 14px 30px rgba(20,48,47,0.2)',
  },
  controls: {
    marginHorizontal: layout.cardMargin,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: spacing[3],
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  shuffle: {
    minHeight: 42,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  title: {
    ...textStyles.body,
    width: 196,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing[3],
    paddingVertical: 0,
  },
  footer: {
    paddingHorizontal: layout.cardMargin,
    paddingTop: spacing[2],
  },
});
