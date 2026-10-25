import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isHabitatPosterUnlocked, type Habitat, type PosterTheme } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { FilterChips, HabitatPoster, Icon, PosterFrame, ProgressBar, Switch, ThemedText, ToggleGroup, TopBar, useTheme } from '@plumario/ui';

import { habitatPosterCells, type HabitatOrder } from '@/components/poster-content';
import { PosterExportActions } from '@/components/poster-export-actions';
import { ALBUM_HABITAT_LABELS, HABITAT_LABELS } from '@/constants/habitats';
import { useAlbum } from '@/hooks/use-album';
import { useCoverPhotos } from '@/hooks/use-cover-photos';
import { useProfile } from '@/hooks/use-profile';

type Props = {
  habitat: Habitat;
  onBack: () => void;
};

/**
 * PosterVista: el póster de un hábitat, siempre visible con las especies que faltan en sombra. Se
 * personaliza (fondo, orden, fotos propias) y se descarga al completar el hábitat.
 */
export function PosterHabitat({ habitat: initial, onBack }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const state = useAlbum();
  const collector = useProfile()?.displayName ?? '';
  const [habitat, setHabitat] = useState(initial);
  const [theme, setTheme] = useState<PosterTheme>('light');
  const [order, setOrder] = useState<HabitatOrder>('number');
  const [seed, setSeed] = useState(7);
  const [withPhotos, setWithPhotos] = useState(false);

  const album = state.status === 'ready' ? state.album : null;
  const sections = album?.habitats.filter((h) => h.total > 0) ?? [];
  const section = sections.find((h) => h.habitat === habitat);
  const owned = section?.entries.filter((e) => e.sticker).map((e) => e.species.id) ?? [];
  const photos = useCoverPhotos(owned, withPhotos);

  if (!album || !section) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <TopBar title="Póster" onBack={onBack} />
        {state.status === 'loading' ? <ActivityIndicator style={styles.loading} /> : <ThemedText color="textSecondary" style={styles.message}>Este hábitat aún no tiene especies en el álbum.</ThemedText>}
      </View>
    );
  }

  const unlocked = isHabitatPosterUnlocked(section);
  const name = ALBUM_HABITAT_LABELS[habitat];
  const poster = (
    <HabitatPoster habitat={habitat} theme={theme} name={name} collector={collector} cells={habitatPosterCells(section, order, seed, photos ?? {})} usePhotos={withPhotos} />
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title={`Póster · ${name}`} subtitle={`${section.registered} de ${section.total} especies · A3`} onBack={onBack} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <FilterChips label="Hábitat" value={habitat} onChange={setHabitat} options={sections.map((h) => ({ key: h.habitat, label: HABITAT_LABELS[h.habitat] }))} />
        </ScrollView>
        <View style={[styles.stage, { backgroundColor: colors.surfaceAlt }]}>
          <PosterFrame width={202} style={styles.poster}>
            {poster}
          </PosterFrame>
        </View>

        <View accessibilityLabel="Personalizar" style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.row}>
            <ThemedText variant="bodyStrong">Fondo</ThemedText>
            <ToggleGroup label="Fondo" value={theme} onChange={setTheme} options={[{ key: 'light', label: 'Claro' }, { key: 'dark', label: 'Oscuro' }]} />
          </View>
          <View style={styles.row}>
            <ThemedText variant="bodyStrong">Orden</ThemedText>
            <ToggleGroup
              label="Orden"
              value={order}
              onChange={(next) => {
                // «Al azar» vuelve a mezclar cada vez que se toca.
                if (next === 'random') setSeed((s) => (s * 31 + 17) % 9973 || 3);
                setOrder(next);
              }}
              options={[
                { key: 'number', label: 'Número' },
                { key: 'mine', label: 'Mis aves' },
                { key: 'random', label: 'Al azar' },
              ]}
            />
          </View>
          <Switch label="Usar mis fotos" value={withPhotos} onChange={setWithPhotos} disabled={owned.length === 0} />
          {withPhotos && photos === null && (
            <ThemedText variant="caption" color="textSecondary" accessibilityLiveRegion="polite">Buscando tus fotos…</ThemedText>
          )}
        </View>

        {unlocked ? (
          <View style={styles.download}>
            <ThemedText variant="section" accessibilityRole="header">Descargar</ThemedText>
            <PosterExportActions poster={poster} caption={`Póster · ${name}`} disabled={withPhotos && photos === null} />
          </View>
        ) : (
          <View accessibilityLabel="Descargar" style={[styles.card, styles.locked, { borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={styles.lockTitle}>
                <Icon name="lock" color={colors.text} size={16} strokeWidth={2.2} />
                <ThemedText variant="bodyStrong">Se habilita al completar el hábitat</ThemedText>
              </View>
              <ThemedText variant="label">{section.registered} de {section.total}</ThemedText>
            </View>
            <ProgressBar current={section.registered} total={section.total} showValue={false} size="thin" color={colors.text} />
            <View style={styles.lockedButtons}>
              {['PNG', 'PDF A3 para imprimir'].map((label) => (
                <View key={label} accessibilityRole="button" accessibilityState={{ disabled: true }} style={[styles.lockedButton, { backgroundColor: colors.surfaceAlt }]}>
                  <ThemedText variant="label" color="textSecondary">{label}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
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
  },
  chips: {
    paddingHorizontal: layout.cardMargin,
  },
  stage: {
    marginHorizontal: layout.cardMargin,
    height: 300,
    borderRadius: radius.hero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poster: {
    borderRadius: 3,
    boxShadow: '0 2px 4px rgba(20,48,47,0.2), 0 14px 30px rgba(20,48,47,0.2)',
  },
  card: {
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
  download: {
    marginHorizontal: layout.cardMargin,
    marginTop: spacing[2],
    gap: spacing[2],
  },
  locked: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: spacing[2],
  },
  lockTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  lockedButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
