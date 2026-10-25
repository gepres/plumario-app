import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TradeProposal, TradeStatus } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { Icon, ThemedText, TopBar, useTheme } from '@plumario/ui';

import { SpeciesSticker } from '@/components/species-sticker';
import { formatShortDate } from '@/constants/cards';
import { useAlbum } from '@/hooks/use-album';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  onBack: () => void;
  onOpenTrade: (tradeId: string) => void;
};

const STATUS_LABELS: Record<TradeStatus, string> = { open: 'Abierta', accepted: 'Aceptada', cancelled: 'Cancelada' };

/** Perfil › Intercambios: las propuestas que hiciste, para volver a compartirlas o cancelarlas. */
export function ProfileTrades({ onBack, onOpenTrade }: Props) {
  const { useCases } = useDependencies();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useSession()?.uid;
  const state = useAlbum();
  const [trades, setTrades] = useState<readonly TradeProposal[] | 'error' | null>(null);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    useCases
      .listMyTrades(userId)
      .then((found) => current && setTrades(found))
      .catch(() => current && setTrades('error'));
    return () => {
      current = false;
    };
  }, [useCases, userId]);

  const entries = state.status === 'ready' ? new Map(state.album.entries.map((e) => [e.species.id, e])) : null;
  const list = trades && trades !== 'error' ? trades : null;
  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Intercambios" onBack={onBack} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}>
        <ThemedText color="textSecondary" style={styles.intro}>
          Los intercambios son solo por enlace o código QR: uno por uno, con un cromo de igual o mayor categoría. Para proponer uno, entra a un sticker y toca «Pedir su cromo» u «Ofrecer en intercambio».
        </ThemedText>
        {(trades === null || !entries) && trades !== 'error' && <ActivityIndicator style={styles.loading} />}
        {trades === 'error' && <ThemedText color="error" style={styles.intro}>No se pudieron cargar tus propuestas. Revisa tu conexión.</ThemedText>}
        {list && entries && list.length === 0 && (
          <ThemedText variant="small" color="textSecondary" style={styles.intro}>Todavía no hiciste propuestas.</ThemedText>
        )}
        {list && entries && list.map((trade) => {
          const offered = entries.get(trade.offeredSpeciesId);
          const requested = entries.get(trade.requestedSpeciesId);
          const open = trade.status === 'open';
          return (
            <Pressable
              key={trade.id}
              accessibilityRole="button"
              accessibilityLabel={`Das ${offered?.species.commonName ?? ''}, pides ${requested?.species.commonName ?? ''}. ${STATUS_LABELS[trade.status]}`}
              onPress={() => onOpenTrade(trade.id)}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: open ? colors.text : colors.line }]}>
              <View style={styles.pair}>
                {offered && <SpeciesSticker entry={offered} size={44} chromed />}
                <Icon name="swap" color={colors.textSecondary} size={16} strokeWidth={2} />
                {requested && <SpeciesSticker entry={requested} size={44} chromed />}
              </View>
              <View style={styles.flex}>
                <ThemedText variant="captionStrong" numberOfLines={1}>Das {offered?.species.commonName}</ThemedText>
                <ThemedText variant="captionStrong" numberOfLines={1}>Pides {requested?.species.commonName}</ThemedText>
                <ThemedText variant="caption" color="textSecondary">{formatShortDate(trade.createdAt)}</ThemedText>
              </View>
              <View style={[styles.status, { backgroundColor: open ? colors.text : colors.surfaceAlt }]}>
                <ThemedText variant="captionStrong" style={{ color: open ? colors.background : colors.textSecondary }}>{STATUS_LABELS[trade.status]}</ThemedText>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    marginTop: spacing[4],
  },
  content: {
    paddingHorizontal: layout.cardMargin,
    gap: spacing[2],
  },
  intro: {
    marginHorizontal: 4,
    marginBottom: spacing[2],
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  status: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
