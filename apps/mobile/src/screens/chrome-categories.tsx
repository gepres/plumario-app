import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chromesView, type CardCategory, type FinishProgress } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, CategoryBadge, InfoNote, ProgressBar, ThemedText, TopBar, useTheme } from '@plumario/ui';

import { ListSkeleton } from '@/components/screen-skeletons';
import { finishTitle } from '@/constants/cards';
import { useAlbum } from '@/hooks/use-album';

const BAR: Record<CardCategory, string> = { holographic: '#8FA9D8', silver: '#8F9BA4', gold: '#D9A93E', ruby: '#A51E36', diamond: '#16324A' };

/** Las especies que ya llegaron a este acabado. */
function yours({ entries }: FinishProgress): string {
  if (!entries.length) return 'Aún no tienes.';
  const names = entries.slice(0, 2).map((e) => e.species.commonName).join(' y ');
  return `${names}${entries.length > 2 ? ` y ${entries.length - 2} más` : ''}.`;
}

/** CategoriasCromos: la escalera de acabados y cuántas especies llegaron a cada uno. */
export function ChromeCategories({ onBack }: { onBack: () => void }) {
  const state = useAlbum();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const view = state.status === 'ready' ? chromesView(state.album) : null;
  const registered = view?.ladder[0]?.registered ?? 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Mis acabados" onBack={onBack} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[4] }]}>
        <ThemedText variant="small" color="textSecondary" style={styles.intro}>
          Toda especie puede llegar a diamante. Aquí ves cuántas de tus {registered} tienen cada acabado o uno mejor.
        </ThemedText>
        {!view && <ListSkeleton rows={5} />}
        {view?.ladder.map((step) => (
          <View key={step.finish} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={{ opacity: step.reached > 0 ? 1 : 0.5 }}>
              <CategoryBadge category={step.finish} size={44} />
            </View>
            <View style={styles.flex}>
              <View style={styles.rowHead}>
                <ThemedText variant="section">{finishTitle(step.finish)}</ThemedText>
                <ThemedText variant="label">{step.reached} de {step.registered}</ThemedText>
              </View>
              <ThemedText variant="caption" color="textSecondary">{step.milestone} observaciones</ThemedText>
              <ProgressBar current={step.reached} total={Math.max(step.registered, 1)} showValue={false} size="thin" color={BAR[step.finish]} />
              <ThemedText variant="caption">{yours(step)}</ThemedText>
            </View>
          </View>
        ))}
        <InfoNote>
          <ThemedText variant="caption" color="textSecondary">
            Los hitos son seguros. Cuenta 1 observación por especie y día, y 1 por semana en las aves amenazadas. Tu primera foto de cada especie puede salir cromada: 1 de cada 8.
          </ThemedText>
        </InfoNote>
        <Button label="Listo" onPress={onBack} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.cardMargin,
    gap: spacing[2],
  },
  intro: {
    marginHorizontal: 4,
    marginBottom: 6,
  },
  row: {
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: spacing[1],
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
});
