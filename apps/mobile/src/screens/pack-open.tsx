import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EconomyError, RECYCLE_FEATHERS, type AlbumEntry, type AlbumView, type Economy, type Pack, type PackOpening, type PieceFinish } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { BirdAvatar, BirdCardCover, BirdPack, Button, CARD_HEIGHT, CARD_WIDTH, FeatherCoin, FlipCard, GradientView, Icon, PACK_HEIGHT, PACK_WIDTH, Rays, ThemedText, useTheme } from '@plumario/ui';

import { PackProgress } from '@/components/pack-progress';
import { needsConfirmation, RecycleSheet } from '@/components/recycle-sheet';
import { SpeciesCard } from '@/components/species-card';
import { CARD_BACK, PACK_ART } from '@/constants/card-art';
import { ECONOMY_ERRORS, FINISH_WITH_ARTICLE, PACK_TITLES, REPEATED_TITLES, feathersLabel } from '@/constants/economy';
import { stickerTint } from '@/constants/habitats';
import { STICKER_ART } from '@/constants/sticker-art';
import { invalidateAlbum } from '@/hooks/album-version';
import { invalidateEconomy } from '@/hooks/economy-version';
import { useAlbum } from '@/hooks/use-album';
import { useEconomy } from '@/hooks/use-economy';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  packId: string;
  onClose: () => void;
  onOpenSpecies: (speciesId: string) => void;
};

/** Lo que tarda en irse el sobre: la carta no se puede tocar antes. */
const TEAR_TIME = 1000;
const CARD_MAX_WIDTH = 270;
const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** SobreAbrir y SobreResultado: se rasga el sobre, la carta espera de espaldas y se revela al tocarla. */
export function PackOpen({ packId, onClose, onOpenSpecies }: Props) {
  const economyState = useEconomy();
  const albumState = useAlbum();
  const { colors } = useTheme();
  const economy = economyState.status === 'ready' ? economyState.economy : null;

  if (economyState.status === 'error' || albumState.status === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ThemedText color="error" style={styles.textCenter}>No se pudo abrir tu sobre. Revisa tu conexión.</ThemedText>
        <Button label="Cerrar" variant="tertiary" onPress={onClose} />
      </View>
    );
  }
  if (!economy || albumState.status !== 'ready') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]} accessibilityLabel="Cargando tu sobre">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return <PackSession packId={packId} economy={economy} album={albumState.album} onClose={onClose} onOpenSpecies={onOpenSpecies} />;
}

/** El sobre se fija al entrar: al abrirlo deja de estar en la lista, y la pantalla debe seguir mostrándolo. */
function PackSession({ packId, economy, album, onClose, onOpenSpecies }: Props & { economy: Economy; album: AlbumView }) {
  const { colors } = useTheme();
  const [pack, setPack] = useState<Pack | null>(() => economy.packs.find((p) => p.id === packId) ?? economy.packs[0] ?? null);
  const waiting = economy.packs.filter((p) => p.id !== pack?.id);

  if (!pack) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ThemedText variant="heading" style={styles.textCenter}>Ya abriste este sobre</ThemedText>
        <ThemedText color="textSecondary" style={styles.textCenter}>Tu próximo sobre sale con 3 observaciones más.</ThemedText>
        <Button label="Cerrar" variant="tertiary" onPress={onClose} />
      </View>
    );
  }
  return (
    <PackFlow
      key={pack.id}
      pack={pack}
      album={album}
      packs={waiting.length + 1}
      observed={economy.wallet.packSpecies.length}
      onNext={waiting[0] ? () => setPack(waiting[0]!) : null}
      onClose={onClose}
      onOpenSpecies={onOpenSpecies}
    />
  );
}

type Step = 'ready' | 'opening' | 'waiting' | 'revealed';

function PackFlow({ pack, album, packs, observed, onNext, onClose, onOpenSpecies }: Pick<Props, 'onClose' | 'onOpenSpecies'> & {
  pack: Pack;
  album: AlbumView;
  packs: number;
  observed: number;
  onNext: (() => void) | null;
}) {
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [step, setStep] = useState<Step>('ready');
  const [opening, setOpening] = useState<PackOpening | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recycling, setRecycling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [recycled, setRecycled] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const entries = useMemo(() => {
    const unique = [...new Set(pack.speciesIds)];
    return unique.flatMap((id) => album.entries.find((e) => e.species.id === id) ?? []);
  }, [album.entries, pack.speciesIds]);

  const cardSize = Math.min(width - spacing[6] * 2, CARD_MAX_WIDTH);
  const cardHeight = (cardSize * CARD_HEIGHT) / CARD_WIDTH;
  // El sobre encoge antes que dejar los botones fuera de la pantalla.
  const packSize = Math.max(150, Math.min(250, width - 120, ((height - insets.top - insets.bottom - 380) * PACK_WIDTH) / PACK_HEIGHT));
  const packHeight = (packSize * PACK_HEIGHT) / PACK_WIDTH;
  const stageHeight = Math.max(packHeight, cardHeight) + spacing[3];
  const cardScale = step === 'ready' || step === 'opening' ? packSize / cardSize : 1;

  async function open() {
    if (!userId) return;
    setError(null);
    setStep('opening');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // El servidor decide en paralelo: una señal lenta no deja la animación a medias.
      const [result] = await Promise.all([useCases.openPack(userId, pack.id), delay(reduced ? 300 : TEAR_TIME)]);
      if (!mounted.current) return;
      setOpening(result);
      setStep('waiting');
      invalidateAlbum();
      invalidateEconomy();
    } catch (failure) {
      if (!mounted.current) return;
      // Abrirlo otra vez no da otra pieza: el servidor devuelve lo que ya trajo.
      setError(ECONOMY_ERRORS[failure instanceof EconomyError ? failure.code : 'unavailable']);
    }
  }

  function reveal() {
    setStep('revealed');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function recycle(finish: PieceFinish, speciesId: string) {
    if (!userId) return;
    setRecycling(true);
    setError(null);
    try {
      await useCases.recyclePiece(userId, speciesId, finish);
      invalidateEconomy();
      setRecycled(true);
      void Haptics.selectionAsync();
    } catch (failure) {
      setError(ECONOMY_ERRORS[failure instanceof EconomyError ? failure.code : 'unavailable']);
    } finally {
      setConfirming(false);
      setRecycling(false);
    }
  }

  const entry = opening ? album.entries.find((e) => e.species.id === opening.speciesId) : undefined;
  const title = PACK_TITLES[pack.design];
  // Una vez abierto ya no cuenta: el aviso dice lo que queda.
  const left = step === 'ready' ? packs : packs - 1;
  const pillLabel = step === 'ready' ? (packs === 1 ? 'Tienes 1 sobre' : `Tienes ${packs} sobres`) : left === 1 ? 'Te queda 1 sobre' : `Te quedan ${left} sobres`;

  return (
    <GradientView gradient={colors.reveal} style={styles.fill}>
      <StatusBar style="light" />
      <View style={[styles.raysWrap, { top: insets.top + 20 }]} pointerEvents="none">
        <Rays size={600} color="rgba(228,199,102,0.08)" fade={colors.reveal.stops[colors.reveal.stops.length - 1]!.color} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing[6] }]}>
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={styles.close}>
            <Icon name="close" color="#F3EDE2" size={22} strokeWidth={2} />
          </Pressable>
          {(step === 'ready' || packs > 1) && (
            <View style={styles.pill}>
              <ThemedText variant="captionStrong" style={styles.cream}>{pillLabel}</ThemedText>
            </View>
          )}
          <View style={styles.close} />
        </View>

        <View style={[styles.heading, step !== 'ready' && styles.hidden]} accessibilityElementsHidden={step !== 'ready'}>
          <ThemedText variant="title" style={styles.whiteCenter}>Tu sobre está listo</ThemedText>
          <ThemedText variant="small" style={[styles.textCenter, { color: colors.onRevealSecondary }]}>Trae una pieza de una de estas aves.</ThemedText>
        </View>

        <View style={[styles.stage, { height: stageHeight }]}>
          <Animated.View
            style={[
              styles.card,
              { width: cardSize, height: cardHeight, left: (width - cardSize) / 2, top: (stageHeight - cardHeight) / 2 },
              { transform: [{ scale: cardScale }], transitionProperty: 'transform', transitionDuration: 500, transitionTimingFunction: EASE_OUT },
            ]}>
            {step === 'revealed' || opening ? (
              <FlipCard
                size={cardSize}
                flipped={step === 'revealed'}
                front={<BirdCardCover image={CARD_BACK} size={cardSize} />}
                back={entry ? <SpeciesCard entry={entry} total={album.total} size={cardSize} finish={opening?.finish} /> : <BirdCardCover image={CARD_BACK} size={cardSize} />}
              />
            ) : (
              <BirdCardCover image={CARD_BACK} size={cardSize} />
            )}
          </Animated.View>
          {step !== 'waiting' && step !== 'revealed' && (
            <View style={[styles.pack, { left: (width - packSize) / 2, top: (stageHeight - packHeight) / 2 }]} pointerEvents="none">
              <BirdPack
                image={PACK_ART[pack.design]}
                title="Plumario"
                subtitle="Colección Ica"
                caption="1 carta de tus últimas 3 aves"
                titleColor={title.color}
                size={packSize}
                opened={step === 'opening'}
                accessibilityLabel={title.alt}
              />
            </View>
          )}
          {step === 'waiting' && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Revelar la carta"
              onPress={reveal}
              style={[styles.tap, { width: cardSize, height: cardHeight, left: (width - cardSize) / 2, top: (stageHeight - cardHeight) / 2 }]}
            />
          )}
        </View>

        {error && <ThemedText variant="small" style={styles.error} accessibilityLiveRegion="polite">{error}</ThemedText>}

        {step === 'ready' && (
          <>
            <View style={styles.birds} accessibilityLabel="Aves de este sobre">
              {entries.map((bird) => (
                <View key={bird.species.id} style={styles.bird}>
                  <BirdAvatar figure={bird.species.figure} art={STICKER_ART[bird.species.id]} tint={stickerTint(bird.species.habitat)} size={56} />
                  <ThemedText variant="caption" numberOfLines={2} style={[styles.textCenter, styles.cream]}>{bird.species.commonName}</ThemedText>
                </View>
              ))}
            </View>
            <View style={styles.progress}>
              <PackProgress observed={observed} dark />
            </View>
            <View style={styles.actions}>
              <Button label="Abrir sobre" variant="light" onPress={() => void open()} />
            </View>
          </>
        )}

        {step === 'opening' && error && (
          <View style={styles.actions}>
            <Button label="Reintentar" variant="light" onPress={() => void open()} />
          </View>
        )}

        {step === 'waiting' && <ThemedText variant="bodyStrong" style={[styles.textCenter, { color: '#F7DE8E' }]}>Toca la carta para revelarla</ThemedText>}

        {step === 'revealed' && opening && entry && (
          <Result
            opening={opening}
            entry={entry}
            recycled={recycled}
            recycling={recycling}
            onRecycle={() => (needsConfirmation(opening.finish) ? setConfirming(true) : void recycle(opening.finish, opening.speciesId))}
            onNext={onNext}
            onClose={onClose}
            onOpenSpecies={onOpenSpecies}
          />
        )}
      </ScrollView>
      <RecycleSheet
        piece={confirming && opening && entry ? { finish: opening.finish, speciesName: entry.species.commonName } : null}
        busy={recycling}
        onConfirm={() => opening && void recycle(opening.finish, opening.speciesId)}
        onClose={() => setConfirming(false)}
      />
    </GradientView>
  );
}

function Result({ opening, entry, recycled, recycling, onRecycle, onNext, onClose, onOpenSpecies }: Pick<Props, 'onClose' | 'onOpenSpecies'> & {
  opening: PackOpening;
  entry: AlbumEntry;
  recycled: boolean;
  recycling: boolean;
  onRecycle: () => void;
  onNext: (() => void) | null;
}) {
  const { colors } = useTheme();
  const { finish, upgraded, speciesId } = opening;
  const soft = { color: colors.onRevealSecondary };
  return (
    <>
      <View style={styles.result} accessibilityRole="summary" accessibilityLiveRegion="polite">
        <ThemedText variant="eyebrow" style={[styles.textCenter, styles.accent]}>{upgraded ? '¡Mejora tu álbum!' : REPEATED_TITLES[finish]}</ThemedText>
        <ThemedText variant="reveal" style={styles.whiteCenter}>{entry.species.commonName}</ThemedText>
        <ThemedText variant="scientific" style={[styles.textCenter, soft]}>{entry.species.scientificName}</ThemedText>
        <ThemedText style={[styles.textCenter, soft]}>
          {upgraded
            ? `Ganaste ${FINISH_WITH_ARTICLE[finish]} en un sobre. Ya se pegó en su casilla.`
            : recycled
              ? `La reciclaste por ${feathersLabel(RECYCLE_FEATHERS[finish])}.`
              : 'Ya tienes este acabado. Quedó en tus repetidas: guárdala o recíclala por plumas.'}
        </ThemedText>
      </View>
      <View style={styles.actions}>
        {upgraded && <Button label="Ver en el álbum" variant="light" onPress={() => onOpenSpecies(speciesId)} />}
        {!upgraded && !recycled && (
          <Pressable accessibilityRole="button" disabled={recycling} onPress={onRecycle} style={[styles.ghost, recycling && styles.dim]}>
            <FeatherCoin size={20} />
            <ThemedText variant="button" style={styles.cream}>Reciclar · {feathersLabel(RECYCLE_FEATHERS[finish])}</ThemedText>
          </Pressable>
        )}
        {onNext ? (
          <Pressable accessibilityRole="button" onPress={onNext} style={styles.ghost}>
            <ThemedText variant="button" style={styles.cream}>Abrir el siguiente sobre</ThemedText>
          </Pressable>
        ) : (
          !upgraded && <Button label={recycled ? 'Listo' : 'Guardar'} variant="light" onPress={onClose} />
        )}
        {upgraded && !onNext && (
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.ghost}>
            <ThemedText variant="button" style={styles.cream}>Listo</ThemedText>
          </Pressable>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    padding: spacing[6],
  },
  content: {
    flexGrow: 1,
    gap: spacing[2],
  },
  raysWrap: {
    position: 'absolute',
    alignSelf: 'center',
  },
  top: {
    height: layout.header,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    backgroundColor: 'rgba(243,237,226,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(243,237,226,0.24)',
  },
  heading: {
    paddingHorizontal: spacing[6],
    gap: 2,
  },
  hidden: {
    opacity: 0,
  },
  stage: {
    position: 'relative',
  },
  card: {
    position: 'absolute',
  },
  pack: {
    position: 'absolute',
  },
  tap: {
    position: 'absolute',
    borderRadius: 16,
  },
  birds: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: layout.cardMargin,
  },
  bird: {
    flex: 1,
    maxWidth: 116,
    alignItems: 'center',
    gap: 4,
  },
  progress: {
    marginHorizontal: layout.cardMargin,
    padding: spacing[3],
    borderRadius: 16,
    backgroundColor: 'rgba(243,237,226,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(243,237,226,0.16)',
  },
  actions: {
    marginTop: 'auto',
    paddingTop: spacing[3],
    paddingHorizontal: layout.cardMargin,
    gap: 10,
  },
  ghost: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(243,237,226,0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  dim: {
    opacity: 0.5,
  },
  result: {
    paddingHorizontal: spacing[6],
    gap: 4,
  },
  error: {
    textAlign: 'center',
    color: '#F7B4A8',
    paddingHorizontal: spacing[6],
  },
  accent: {
    color: '#F2EAB8',
  },
  cream: {
    color: '#F3EDE2',
  },
  whiteCenter: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
});
