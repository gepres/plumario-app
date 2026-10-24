import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { SPECIES_PER_POSTER, type AlbumSummary } from '@plumario/core';
import { radius, spacing } from '@plumario/tokens';
import { Card, GradientView, ProgressBar, Screen, ThemedText, useTheme } from '@plumario/ui';

import { ComingSoon } from '@/components/coming-soon';
import { HABITAT_LABELS } from '@/constants/habitats';
import { useAlbumSummary } from '@/hooks/use-album-summary';

/** Inicio: el avance del álbum (hero), el próximo póster y el avance por hábitat. */
export function Home() {
  const state = useAlbumSummary();

  return (
    <Screen eyebrow="Álbum de aves · Edición inicial" title="Aves de Ica">
      {state.status === 'loading' && <ActivityIndicator />}
      {state.status === 'error' && <ThemedText color="error">No se pudo cargar tu álbum: {state.error.message}</ThemedText>}
      {state.status === 'ready' && <Summary summary={state.summary} />}
      <ComingSoon
        description="Tus últimas aves y las especies por descubrir en tu hábitat."
        design={['Inicio', 'InicioVacio']}
      />
    </Screen>
  );
}

function Summary({ summary }: { summary: AlbumSummary }) {
  const { colors } = useTheme();
  return (
    <>
      <GradientView gradient={colors.hero} style={styles.hero}>
        <View style={styles.count}>
          <ThemedText variant="sheet" style={{ color: colors.onHero }}>{summary.registered}</ThemedText>
          <ThemedText variant="bodyStrong" style={{ color: colors.onHero }}>de {summary.total} especies de Ica</ThemedText>
        </View>
        <ProgressBar current={summary.registered} total={summary.total} showValue={false} onHero />
        {summary.registered === 0 && (
          <ThemedText variant="caption" style={{ color: colors.onHeroSecondary }}>Toma la foto de un ave para empezar tu álbum.</ThemedText>
        )}
      </GradientView>

      {summary.nextPoster && (
        <Card>
          <ThemedText variant="bodyStrong">Póster {summary.nextPoster.number}: te faltan {summary.nextPoster.remaining}</ThemedText>
          <ThemedText variant="caption" color="textSecondary">Cada {SPECIES_PER_POSTER} especies se arma un póster con tus aves.</ThemedText>
        </Card>
      )}

      <View style={styles.section}>
        <ThemedText variant="section">Por hábitat</ThemedText>
        {summary.byHabitat
          .filter((h) => h.total > 0)
          .map((h) => (
            <ProgressBar key={h.habitat} label={HABITAT_LABELS[h.habitat]} current={h.registered} total={h.total} />
          ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.hero,
    paddingVertical: 14,
    paddingHorizontal: spacing[4],
    gap: 10,
  },
  count: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  section: {
    gap: spacing[3],
  },
});
