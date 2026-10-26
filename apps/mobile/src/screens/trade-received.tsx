import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORY_RANK, receivedTrade, type AlbumEntry, type TradeProposal, type TradeResult } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { Button, Icon, ThemedText, TopBar, useTheme } from '@plumario/ui';

import { PosterSkeleton } from '@/components/screen-skeletons';
import { SpeciesSticker } from '@/components/species-sticker';
import { CATEGORY_LABELS } from '@/constants/cards';
import { tradeLink, tradeProblemMessage } from '@/constants/trades';
import { invalidateAlbum } from '@/hooks/album-version';
import { useAlbum } from '@/hooks/use-album';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  tradeId: string;
  onClose: () => void;
  onOpenSticker: (speciesId: string) => void;
};

type Rejection = Extract<TradeResult, { outcome: 'rejected' }>['reason'];
type Phase = { step: 'review' } | { step: 'accepting' } | { step: 'done' } | { step: 'rejected'; reason: Rejection } | { step: 'failed' };

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * IntercambioRecibido: quien abre el enlace (o escanea el QR) ve qué recibe y qué da, si puede
 * aceptarlo con su álbum, y lo acepta. El intercambio lo hace el servidor en una transacción.
 */
export function TradeReceived({ tradeId, onClose, onOpenSticker }: Props) {
  const { useCases } = useDependencies();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useSession()?.uid;
  const state = useAlbum();
  const [trade, setTrade] = useState<TradeProposal | 'missing' | 'error' | null>(null);
  const [phase, setPhase] = useState<Phase>({ step: 'review' });

  useEffect(() => {
    // Se decide con el álbum de ahora: si quedó uno viejo en memoria, podría bloquear algo que sí se puede.
    invalidateAlbum();
    let current = true;
    useCases
      .getTrade(tradeId)
      .then((found) => current && setTrade(found ?? 'missing'))
      .catch(() => current && setTrade('error'));
    return () => {
      current = false;
    };
  }, [useCases, tradeId]);

  const album = state.status === 'ready' ? state.album : null;
  const loaded = trade && typeof trade === 'object' ? trade : null;
  const view = loaded && album && userId ? receivedTrade(loaded, album, userId) : null;

  async function accept() {
    if (!userId) return;
    setPhase({ step: 'accepting' });
    try {
      const result = await useCases.acceptTrade(tradeId, userId);
      if (result.outcome === 'accepted') {
        invalidateAlbum();
        setPhase({ step: 'done' });
      } else setPhase({ step: 'rejected', reason: result.reason });
    } catch {
      setPhase({ step: 'failed' });
    }
  }

  async function cancel() {
    if (!loaded) return;
    try {
      await useCases.cancelTrade(tradeId);
      setTrade({ ...loaded, status: 'cancelled' });
    } catch {
      setPhase({ step: 'failed' });
    }
  }

  const names = view?.offered && view.requested && loaded ? { offered: view.offered.species.commonName, requested: view.requested.species.commonName, handle: loaded.fromHandle } : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Propuesta de intercambio" onBack={onClose} close />
      {(trade === null || (loaded && !view)) && <PosterSkeleton inset />}
      {(trade === 'missing' || trade === 'error') && (
        <ThemedText color="textSecondary" style={styles.message}>
          {trade === 'missing' ? 'No encontramos esta propuesta. Pide que te manden el enlace de nuevo.' : 'No se pudo abrir la propuesta. Revisa tu conexión.'}
        </ThemedText>
      )}
      {loaded && view && phase.step === 'done' && view.offered && view.requested && (
        <Done offered={view.offered} requested={view.requested} onOpen={() => onOpenSticker(view.offered!.species.id)} onClose={onClose} />
      )}
      {loaded && view && phase.step !== 'done' && (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.from}>
              <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}>
                <Icon name="profile" color={colors.text} size={22} strokeWidth={1.8} />
              </View>
              <ThemedText style={styles.flex}>
                {view.status === 'own' ? (
                  loaded.status === 'open' ? 'Esta es tu propuesta. Compártela con quien tenga el cromo que buscas.' : 'Esta es tu propuesta.'
                ) : (
                  <>
                    <ThemedText variant="bodyStrong">@{loaded.fromHandle}</ThemedText> te propone cambiar un cromo
                  </>
                )}
              </ThemedText>
            </View>

            {view.offered && view.requested && (
              <View style={[styles.cards, { backgroundColor: colors.surface, borderColor: colors.line }]} accessibilityLabel="Cromos del intercambio">
                <Side label={view.status === 'own' ? 'Das' : 'Recibes'} entry={view.offered} color={colors.success} />
                <View style={[styles.swap, { backgroundColor: colors.text }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Icon name="swap" color={colors.background} size={20} strokeWidth={2} />
                </View>
                <Side label={view.status === 'own' ? 'Pides' : 'Das'} entry={view.requested} color={colors.warning} />
              </View>
            )}

            <View style={styles.notes}>
              {view.status === 'ready' && names && view.offered && view.requested && (
                <Note ok>
                  Ya registraste {names.offered} y su cromo es de {CATEGORY_RANK[view.offered.category] === CATEGORY_RANK[view.requested.category] ? 'la misma categoría que' : 'una categoría mayor que'} el tuyo.
                </Note>
              )}
              {view.status === 'blocked' && names && <Note problem>{tradeProblemMessage(view.problem, names)}</Note>}
              {(view.status === 'accepted' || view.status === 'cancelled') && <Note problem>Esta propuesta ya no está disponible.</Note>}
              {view.status === 'own' && loaded.status !== 'open' && (
                <Note ok={loaded.status === 'accepted'}>{loaded.status === 'accepted' ? 'Ya la aceptaron: el intercambio está hecho.' : 'Cancelaste esta propuesta.'}</Note>
              )}
              {view.status === 'unknown-species' && <Note problem>Esta propuesta es de especies que no están en tu álbum.</Note>}
              {phase.step === 'rejected' && names && <Note problem>{tradeProblemMessage(phase.reason, names)}</Note>}
              {phase.step === 'failed' && <Note problem>No se pudo completar. Revisa tu conexión y vuelve a intentar.</Note>}
              {view.status !== 'own' && names && <Note>Tu {names.requested} vuelve a su sticker normal. Tus fotos y tu progreso no cambian.</Note>}
              <Note>Solo se intercambian los cromos: no se comparten fotos ni ubicación.</Note>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
            {view.status === 'own' && loaded.status === 'open' && (
              <>
                <Button label="Compartir enlace" icon="share" onPress={() => void Share.share({ message: `Te propongo un intercambio en Plumario. Ábrelo acá: ${tradeLink(tradeId)}` })} />
                <Button label="Cancelar propuesta" variant="secondary" onPress={() => void cancel()} />
              </>
            )}
            {(view.status === 'ready' || view.status === 'blocked') && (
              <>
                <Button label="Aceptar intercambio" onPress={() => void accept()} busy={phase.step === 'accepting'} disabled={view.status !== 'ready' || phase.step === 'rejected'} />
                <Button label="Rechazar" variant="secondary" onPress={onClose} disabled={phase.step === 'accepting'} />
              </>
            )}
            {view.status !== 'ready' && view.status !== 'blocked' && !(view.status === 'own' && loaded.status === 'open') && <Button label="Cerrar" variant="secondary" onPress={onClose} />}
          </View>
        </>
      )}
    </View>
  );
}

function Side({ label, entry, color }: { label: string; entry: AlbumEntry; color: string }) {
  return (
    <View style={styles.side} accessible accessibilityLabel={`${label}: ${entry.species.commonName}, cromo ${CATEGORY_LABELS[entry.category]}`}>
      <ThemedText variant="eyebrow" style={{ color }}>{label}</ThemedText>
      <SpeciesSticker entry={entry} size={128} chromed />
      <ThemedText variant="label" style={styles.center}>{entry.species.commonName}</ThemedText>
      <ThemedText variant="caption" color="textSecondary" style={styles.center}>{capitalize(CATEGORY_LABELS[entry.category])}</ThemedText>
    </View>
  );
}

function Note({ children, ok = false, problem = false }: { children: ReactNode; ok?: boolean; problem?: boolean }) {
  const { colors } = useTheme();
  const background = ok ? colors.success : problem ? colors.error : colors.surfaceAlt;
  return (
    <View style={styles.note}>
      <View style={[styles.noteIcon, { backgroundColor: background }]}>
        {ok ? <Icon name="check" color={colors.background} size={12} strokeWidth={3} /> : problem ? <Icon name="alert" color={colors.background} size={12} strokeWidth={2.6} /> : <ThemedText variant="captionStrong">i</ThemedText>}
      </View>
      <ThemedText variant="small" color={problem ? 'error' : 'text'} style={styles.flex}>{children}</ThemedText>
    </View>
  );
}

function Done({ offered, requested, onOpen, onClose }: { offered: AlbumEntry; requested: AlbumEntry; onOpen: () => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.done, { paddingBottom: insets.bottom + spacing[4] }]}>
      <View style={styles.doneBody} accessibilityRole="summary" accessibilityLiveRegion="polite">
        <View style={styles.tilt}>
          <SpeciesSticker entry={offered} size={180} chromed />
        </View>
        <ThemedText variant="eyebrow" color="success" style={styles.center}>¡Intercambio hecho!</ThemedText>
        <ThemedText variant="title" style={styles.center}>Tu cromo de {offered.species.commonName}</ThemedText>
        <ThemedText color="textSecondary" style={styles.center}>Ya está en tu álbum. Tu {requested.species.commonName} volvió a su sticker normal.</ThemedText>
      </View>
      <View style={styles.doneActions}>
        <Button label="Ver mi cromo" onPress={onOpen} />
        <Button label="Cerrar" variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  message: {
    marginHorizontal: layout.textMargin,
  },
  content: {
    paddingBottom: spacing[4],
  },
  from: {
    marginTop: 4,
    marginHorizontal: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  cards: {
    marginTop: spacing[4],
    marginHorizontal: layout.cardMargin,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
  },
  swap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    width: '100%',
    textAlign: 'center',
  },
  notes: {
    marginTop: 14,
    marginHorizontal: spacing[5],
    gap: 10,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: layout.cardMargin,
    paddingTop: spacing[2],
    gap: 10,
  },
  done: {
    flex: 1,
    justifyContent: 'space-between',
  },
  doneBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  tilt: {
    transform: [{ rotate: '-4deg' }],
    marginBottom: spacing[4],
  },
  doneActions: {
    paddingHorizontal: layout.cardMargin,
    gap: 10,
  },
});
