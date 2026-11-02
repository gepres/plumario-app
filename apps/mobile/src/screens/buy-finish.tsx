import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EconomyError, FINISH_PRICES, nextFinish, premiumAvailableAt, purchaseProblem } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, Icon, ThemedText, TopBar, useTheme } from '@plumario/ui';

import { FeatherBalance } from '@/components/feather-balance';
import { SpeciesSticker } from '@/components/species-sticker';
import { CATEGORY_LABELS, finishTitle, formatLongDate } from '@/constants/cards';
import { ECONOMY_ERRORS, feathersLabel } from '@/constants/economy';
import { invalidateAlbum } from '@/hooks/album-version';
import { invalidateEconomy } from '@/hooks/economy-version';
import { useAlbum } from '@/hooks/use-album';
import { useEconomy } from '@/hooks/use-economy';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

/** CompraAcabado: sube la carta al acabado siguiente con plumas. La foto sigue siendo la única forma de sumar un ave. */
export function BuyFinish({ speciesId, onBack }: { speciesId: string; onBack: () => void }) {
  const { colors } = useTheme();
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const insets = useSafeAreaInsets();
  const albumState = useAlbum();
  const economyState = useEconomy();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entry = albumState.status === 'ready' ? albumState.album.entries.find((e) => e.species.id === speciesId) : undefined;
  const wallet = economyState.status === 'ready' ? economyState.economy.wallet : null;
  const next = entry?.sticker ? nextFinish(entry.finish) : null;

  async function buy() {
    if (!userId || !next) return;
    setBusy(true);
    setError(null);
    try {
      await useCases.buyFinish(userId, speciesId, next);
      invalidateAlbum();
      invalidateEconomy();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onBack();
    } catch (failure) {
      setError(ECONOMY_ERRORS[failure instanceof EconomyError ? failure.code : 'unavailable']);
      setBusy(false);
    }
  }

  const now = new Date();
  const price = next ? FINISH_PRICES[next] : 0;
  const problem = entry?.sticker && wallet && next ? purchaseProblem({ sticker: entry.sticker, wallet, finish: next, at: now }) : null;
  const returns = wallet && problem === 'monthly-limit' ? premiumAvailableAt(wallet, now) : null;
  const label = next ? `Subir a ${CATEGORY_LABELS[next]} · ${feathersLabel(price)}` : '';

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing[6] }]}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <TopBar title="Subir de acabado" onBack={onBack} />
        </View>
        {wallet && <FeatherBalance feathers={wallet.feathers} />}
      </View>

      {entry && !next && <ThemedText color="textSecondary" style={styles.message}>Esta carta ya llegó a diamante: no hay nada más que subir.</ThemedText>}

      {entry && next && (
        <>
          <View style={[styles.change, { backgroundColor: colors.surface, borderColor: colors.line }]} accessible accessibilityLabel={`${entry.species.commonName}: de ${entry.finish ? finishTitle(entry.finish) : 'normal'} a ${finishTitle(next)}`}>
            <View style={styles.side}>
              <ThemedText variant="eyebrow" color="textSecondary">Ahora</ThemedText>
              <SpeciesSticker entry={entry} size={128} />
              <ThemedText variant="label">{entry.finish ? finishTitle(entry.finish) : 'Normal'}</ThemedText>
            </View>
            <View style={[styles.arrow, { backgroundColor: colors.text }]}>
              <Icon name="chevronRight" color={colors.background} size={20} strokeWidth={2} />
            </View>
            <View style={styles.side}>
              <ThemedText variant="eyebrow" color="primary">Sube a</ThemedText>
              <SpeciesSticker entry={{ ...entry, finish: next }} size={128} />
              <ThemedText variant="label">{finishTitle(next)}</ThemedText>
            </View>
          </View>

          <View style={styles.notes}>
            {[
              'Solo se sube al acabado siguiente.',
              wallet && problem !== 'not-enough' ? `Te quedarán ${feathersLabel(wallet.feathers - price)}.` : null,
              'Comprar no suma observaciones ni registra aves.',
              'El hito de este acabado ya no pagará plumas.',
            ].flatMap((note) => (note ? [note] : [])).map((note) => (
              <View key={note} style={styles.note}>
                <View style={[styles.dot, { backgroundColor: colors.line }]}>
                  <ThemedText variant="captionStrong">i</ThemedText>
                </View>
                <ThemedText variant="small" style={styles.flex}>{note}</ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            {problem === 'monthly-limit' && (
              <View style={[styles.notice, { backgroundColor: colors.surfaceAlt }]} accessibilityLiveRegion="polite">
                <ThemedText variant="small">Ya compraste un rubí o diamante este mes.{returns ? ` Vuelve el ${formatLongDate(returns)}.` : ''}</ThemedText>
              </View>
            )}
            {problem === 'not-enough' && wallet && (
              <ThemedText variant="small" color="textSecondary" style={styles.center} accessibilityLiveRegion="polite">Te faltan {feathersLabel(price - wallet.feathers)}.</ThemedText>
            )}
            {error && <ThemedText variant="small" color="error" style={styles.center} accessibilityLiveRegion="polite">{error}</ThemedText>}
            <Button label={label} disabled={!wallet || !!problem} busy={busy} onPress={() => void buy()} />
            <Button label="Ahora no" variant="tertiary" onPress={onBack} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing[3],
  },
  message: {
    margin: layout.cardMargin,
  },
  change: {
    marginHorizontal: layout.cardMargin,
    marginTop: spacing[2],
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: radius.sheet,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notes: {
    marginHorizontal: spacing[5],
    marginTop: spacing[4],
    gap: 10,
  },
  note: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    marginTop: 'auto',
    paddingTop: spacing[4],
    paddingHorizontal: layout.cardMargin,
    gap: 10,
  },
  notice: {
    padding: spacing[3],
    borderRadius: 16,
  },
  center: {
    textAlign: 'center',
  },
});
