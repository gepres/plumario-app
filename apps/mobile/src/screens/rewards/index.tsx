import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chromesView, rewardsView } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { Button, SegmentedTabs, StatusBarScrim, ThemedText } from '@plumario/ui';

import { ComingSoon } from '@/components/coming-soon';
import { useAchievements } from '@/hooks/use-achievements';
import { useAlbum } from '@/hooks/use-album';

import { Chromes } from './chromes';
import { Medals } from './medals';

export type RewardsTab = 'medals' | 'chromes' | 'posters';

type Props = {
  onOpenAlbum: () => void;
  onOpenCategories: () => void;
  onOpenSticker: (speciesId: string) => void;
  onOpenSpecies: (speciesId: string) => void;
};

/** Mis recompensas (design/project/Main.dc.html): medallas, cromos y pósteres. */
export function Rewards(props: Props) {
  const state = useAlbum();
  const records = useAchievements();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<RewardsTab>('medals');
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
          onChange={setTab}
          tabs={[
            { key: 'medals', label: 'Medallas' },
            { key: 'chromes', label: 'Cromos' },
            { key: 'posters', label: 'Pósteres' },
          ]}
        />
        {state.status === 'loading' && <ActivityIndicator style={styles.loading} />}
        {state.status === 'error' && (
          <View style={styles.error}>
            <ThemedText color="error">No se pudieron cargar tus recompensas. Revisa tu conexión.</ThemedText>
            <Button label="Reintentar" variant="secondary" onPress={state.refresh} />
          </View>
        )}
        {state.status === 'ready' && rewards && tab === 'medals' && <Medals rewards={rewards} onOpenAlbum={props.onOpenAlbum} />}
        {state.status === 'ready' && tab === 'chromes' && (
          <Chromes chromes={chromesView(state.album)} onOpenCategories={props.onOpenCategories} onOpenSticker={props.onOpenSticker} onOpenSpecies={props.onOpenSpecies} />
        )}
        {tab === 'posters' && (
          <ComingSoon description="Un póster cada 10 especies y uno por hábitat, para descargar en PNG y PDF A3." design={['RecompensasPosteres', 'PosterGenerar', 'PosterVista']} />
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
  loading: {
    marginTop: spacing[6],
  },
  error: {
    gap: spacing[3],
  },
});
