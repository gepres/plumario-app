import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EconomyError, RECYCLE_FEATHERS, TRADES_PAUSED, duplicatesByFinish, type PieceFinish, type SpeciesId } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { Button, FeatherCoin, ThemedText, TopBar, useTheme } from '@plumario/ui';

import { ListSkeleton } from '@/components/screen-skeletons';
import { needsConfirmation, RecycleSheet } from '@/components/recycle-sheet';
import { SpeciesSticker } from '@/components/species-sticker';
import { finishTitle } from '@/constants/cards';
import { ECONOMY_ERRORS, feathersLabel } from '@/constants/economy';
import { invalidateEconomy } from '@/hooks/economy-version';
import { useAlbum } from '@/hooks/use-album';
import { useEconomy } from '@/hooks/use-economy';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

type Piece = { speciesId: SpeciesId; finish: PieceFinish };

const repeatedLabel = (count: number) => (count === 1 ? '1 repetida' : `${count} repetidas`);

/** MisRepetidas: el saldo de plumas, cómo se gana y las repetidas por acabado. */
export function Duplicates({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const insets = useSafeAreaInsets();
  const economyState = useEconomy();
  const albumState = useAlbum();
  const [busy, setBusy] = useState<Piece | null>(null);
  const [confirming, setConfirming] = useState<Piece | null>(null);
  const [error, setError] = useState<string | null>(null);

  const entries = albumState.status === 'ready' ? albumState.album.entries : [];
  const entryOf = (speciesId: SpeciesId) => entries.find((e) => e.species.id === speciesId);

  async function recycle(piece: Piece) {
    if (!userId) return;
    setBusy(piece);
    setError(null);
    try {
      await useCases.recyclePiece(userId, piece.speciesId, piece.finish);
      invalidateEconomy();
      void Haptics.selectionAsync();
    } catch (failure) {
      setError(ECONOMY_ERRORS[failure instanceof EconomyError ? failure.code : 'unavailable']);
    } finally {
      setBusy(null);
      setConfirming(null);
    }
  }

  const economy = economyState.status === 'ready' ? economyState.economy : null;
  const groups = economy ? duplicatesByFinish(economy.pieces) : [];

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + spacing[6] }}>
      <TopBar title="Mis repetidas" onBack={onBack} />

      <View style={[styles.balance, { backgroundColor: colors.text }]} accessible>
        <FeatherCoin size={44} />
        <View style={styles.flex}>
          <ThemedText variant="heading" style={{ color: colors.background }}>{economy ? feathersLabel(economy.wallet.feathers) : 'Plumas'}</ThemedText>
          <ThemedText variant="caption" style={{ color: colors.background, opacity: 0.8 }}>Ganas 1 por observación válida y más al reciclar repetidas. Nunca se venden.</ThemedText>
        </View>
      </View>

      {economyState.status === 'loading' && <ListSkeleton rows={3} label="Cargando tus repetidas…" />}
      {economyState.status === 'error' && (
        <View style={styles.message}>
          <ThemedText color="error">No se pudieron cargar tus repetidas. Revisa tu conexión.</ThemedText>
          <Button label="Reintentar" variant="secondary" onPress={economyState.refresh} />
        </View>
      )}
      {error && <ThemedText color="error" variant="small" style={styles.message} accessibilityLiveRegion="polite">{error}</ThemedText>}
      {economy && groups.length === 0 && (
        <ThemedText color="textSecondary" style={styles.message}>
          Aún no tienes repetidas. Aparecen cuando la pieza de un sobre no supera el acabado que ya tienes.
        </ThemedText>
      )}

      <View style={styles.groups}>
        {groups.map((group) => (
          <View key={group.finish} style={styles.group}>
            <View style={styles.groupHead}>
              <ThemedText variant="section" accessibilityRole="header">{finishTitle(group.finish)}</ThemedText>
              <ThemedText variant="small" color="textSecondary">{repeatedLabel(group.total)}</ThemedText>
            </View>
            {group.pieces.map(({ speciesId, count }) => {
              const entry = entryOf(speciesId);
              if (!entry) return null;
              const piece = { speciesId, finish: group.finish };
              const working = busy?.speciesId === speciesId && busy.finish === group.finish;
              return (
                <View key={speciesId} style={[styles.piece, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                  <View style={styles.pieceHead}>
                    <SpeciesSticker entry={{ ...entry, finish: group.finish }} size={48} />
                    <View style={styles.flex}>
                      <ThemedText variant="bodyStrong">{entry.species.commonName}</ThemedText>
                      <ThemedText variant="caption" color="textSecondary">Tienes {count} de más</ThemedText>
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Reciclar ${finishTitle(group.finish)} de ${entry.species.commonName} por ${feathersLabel(RECYCLE_FEATHERS[group.finish])}`}
                    accessibilityState={{ busy: working }}
                    disabled={!!busy}
                    onPress={() => (needsConfirmation(group.finish) ? setConfirming(piece) : void recycle(piece))}
                    style={[styles.recycle, { borderColor: colors.line }, working && styles.dim]}>
                    <FeatherCoin size={18} />
                    <ThemedText variant="label">Reciclar · {feathersLabel(RECYCLE_FEATHERS[group.finish])}</ThemedText>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <ThemedText variant="caption" color="textSecondary" style={styles.footnote}>
        {TRADES_PAUSED ? 'Guárdalas si quieres: cuando vuelva el intercambio, cambiar una repetida rendirá más que reciclarla.' : 'Cambiar una repetida rinde más que reciclarla.'} Los sobres no traen holográficos.
      </ThemedText>

      <RecycleSheet
        piece={confirming ? { finish: confirming.finish, speciesName: entryOf(confirming.speciesId)?.species.commonName ?? '' } : null}
        busy={!!busy}
        onConfirm={() => confirming && void recycle(confirming)}
        onClose={() => setConfirming(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  balance: {
    marginHorizontal: layout.cardMargin,
    padding: spacing[3],
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  message: {
    marginHorizontal: layout.cardMargin,
    marginTop: spacing[3],
    gap: spacing[2],
  },
  groups: {
    paddingHorizontal: layout.cardMargin,
    paddingTop: 14,
    gap: 14,
  },
  group: {
    gap: spacing[2],
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  piece: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    gap: spacing[2],
  },
  pieceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recycle: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dim: {
    opacity: 0.5,
  },
  footnote: {
    marginHorizontal: spacing[5],
    marginTop: spacing[3],
  },
});
