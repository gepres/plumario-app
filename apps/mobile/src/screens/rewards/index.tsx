import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chromesView, postersView, rewardsView, type Habitat } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { Button, SegmentedTabs, StatusBarScrim, ThemedText } from '@plumario/ui';

import { ListSkeleton, MedalsSkeleton } from '@/components/screen-skeletons';
import { useAchievements } from '@/hooks/use-achievements';
import { useAlbum } from '@/hooks/use-album';
import { usePosters } from '@/hooks/use-posters';
import { useCollectorName } from '@/hooks/use-profile';

import { Chromes } from './chromes';
import { Medals } from './medals';
import { Posters } from './posters';

export type RewardsTab = 'medals' | 'chromes' | 'posters';

type Props = {
  tab: RewardsTab;
  onChangeTab: (tab: RewardsTab) => void;
  onOpenAlbum: () => void;
  onOpenCategories: () => void;
  onOpenSticker: (speciesId: string) => void;
  onOpenSpecies: (speciesId: string) => void;
  onOpenPoster: (posterId: string) => void;
  onGeneratePoster: (number: number) => void;
  onOpenHabitatPoster: (habitat: Habitat) => void;
  onShareMedal: (achievementId: string) => void;
};

/** Mis recompensas (design/project/Main.dc.html): medallas, cromos y pósteres. */
export function Rewards(props: Props) {
  const state = useAlbum();
  const records = useAchievements();
  const posters = usePosters();
  const collector = useCollectorName();
  const insets = useSafeAreaInsets();
  const { tab } = props;
  const rewards = state.status === 'ready' ? rewardsView(state.album, records ?? []) : null;

  return (
    <>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4], paddingBottom: layout.tabBar + insets.bottom + spacing[4] }]}>
        <View style={styles.header}>
          <ThemedText variant="title" accessibilityRole="header">Mis recompensas</ThemedText>
          {rewards && (
            <ThemedText variant="caption" color="textSecondary">
              {rewards.registered} de {rewards.total} especies · {rewards.earned.length} {rewards.earned.length === 1 ? 'medalla' : 'medallas'} · {rewards.chromes} {rewards.chromes === 1 ? 'cromo' : 'cromos'}
            </ThemedText>
          )}
        </View>
        <SegmentedTabs
          label="Categorías de recompensas"
          value={tab}
          onChange={props.onChangeTab}
          tabs={[
            { key: 'medals', label: 'Medallas' },
            { key: 'chromes', label: 'Cromos' },
            { key: 'posters', label: 'Pósteres' },
          ]}
        />
        {state.status === 'loading' && <MedalsSkeleton />}
        {state.status === 'error' && (
          <View style={styles.error}>
            <ThemedText color="error">No se pudieron cargar tus recompensas. Revisa tu conexión.</ThemedText>
            <Button label="Reintentar" variant="secondary" onPress={state.refresh} />
          </View>
        )}
        {state.status === 'ready' && rewards && tab === 'medals' && <Medals rewards={rewards} onOpenAlbum={props.onOpenAlbum} onShareMedal={props.onShareMedal} />}
        {state.status === 'ready' && tab === 'chromes' && (
          <Chromes chromes={chromesView(state.album)} onOpenCategories={props.onOpenCategories} onOpenSticker={props.onOpenSticker} onOpenSpecies={props.onOpenSpecies} />
        )}
        {state.status === 'ready' && tab === 'posters' && !posters && <ListSkeleton rows={3} label="Cargando tus pósteres…" />}
        {state.status === 'ready' && tab === 'posters' && posters && (
          <Posters
            album={state.album}
            posters={postersView(state.album, posters)}
            collector={collector}
            onOpenPoster={props.onOpenPoster}
            onGenerate={props.onGeneratePoster}
            onOpenHabitat={props.onOpenHabitatPoster}
          />
        )}
      </ScrollView>
      <StatusBarScrim />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.cardMargin,
    gap: spacing[3],
  },
  header: {
    paddingHorizontal: 4,
    gap: 2,
  },
  error: {
    gap: spacing[3],
  },
});
