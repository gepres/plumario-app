import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  PHOTOS_FOR_CHROME,
  SPECIES_PER_POSTER,
  achievementId,
  nextPoster,
  type Achievement,
  type AlbumEntry,
  type Sighting,
  type SightingResult,
} from '@plumario/core';
import type { Gradient } from '@plumario/tokens';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, GradientView, HOLOGRAPHIC, Icon, Medal, ProgressBar, Rays, ThemedText, useTheme, type MedalKind } from '@plumario/ui';

import { SpeciesSticker } from '@/components/species-sticker';
import { CATEGORY_LABELS, CATEGORY_REASONS } from '@/constants/cards';
import { HABITAT_MEDALS } from '@/constants/habitats';
import { invalidateAlbum } from '@/hooks/album-version';
import { useAlbum } from '@/hooks/use-album';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  sightingId: string;
  speciesId: string;
  onClose: () => void;
  onOpenSpecies: (speciesId: string) => void;
  onRegisterAnother: () => void;
  onRetry: (speciesId: string) => void;
};

type Validated = Extract<SightingResult, { outcome: 'validated' }>;

/** RegistrarCompletado, RevelarCromado y RevelarDiamante: lo que pasó con la foto al validarse. */
export function SightingResultScreen(props: Props) {
  const { watchSighting } = useDependencies();
  const userId = useSession()?.uid;
  const [sighting, setSighting] = useState<Sighting | null>(null);
  const celebrated = useRef(false);

  useEffect(() => {
    if (!userId) return;
    return watchSighting(userId, props.sightingId, setSighting);
  }, [watchSighting, userId, props.sightingId]);

  const result = sighting?.result ?? null;

  useEffect(() => {
    if (!result || celebrated.current) return;
    celebrated.current = true;
    // El álbum, Inicio y la galería vuelven a leer los stickers.
    invalidateAlbum();
    void Haptics.notificationAsync(result.outcome === 'validated' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
  }, [result]);

  const state = useAlbum();
  const entry = state.status === 'ready' ? state.album.entries.find((e) => e.species.id === props.speciesId) : undefined;

  if (!result || !entry) return <Waiting />;
  if (result.outcome === 'rejected') return <Rejected entry={entry} reason={result.reason} {...props} />;
  // Mientras el álbum se vuelve a leer, la entrada puede venir sin el sticker nuevo: se arma con el resultado.
  if (result.chromed) return <Reveal entry={entry} result={result} {...props} />;
  if (result.completed) return <Completed entry={entry} result={result} {...props} />;
  return <AddedToGallery entry={entry} result={result} {...props} />;
}

function Waiting() {
  const { colors } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.primary} />
      <ThemedText variant="section">La IA está revisando tu foto…</ThemedText>
      <ThemedText variant="small" color="textSecondary" style={styles.centerText}>
        Revisa que sea la especie que elegiste. Si no hay señal, se valida en cuanto vuelva.
      </ThemedText>
    </View>
  );
}

/** El sticker como quedó después de esta foto, aunque el álbum todavía no lo haya releído. */
function entryAfter(entry: AlbumEntry, result: Validated): AlbumEntry {
  const now = new Date();
  return {
    ...entry,
    sticker: {
      speciesId: entry.species.id,
      completedAt: entry.sticker?.completedAt ?? now,
      validPhotos: result.validPhotos,
      chrome: result.chromed ? { source: result.chromed, at: now } : (entry.sticker?.chrome ?? null),
    },
  };
}

const CHROME_TITLES = {
  holographic: '¡Salió cromado!',
  silver: '¡Cromo plata!',
  gold: '¡Cromo oro!',
  ruby: '¡Cromo rubí!',
  diamond: '¡Cromo diamante!',
} as const;

const DIAMOND_NIGHT: Gradient = {
  type: 'radial',
  center: { x: 0.5, y: 0.32 },
  stops: [{ color: '#1F4A66', position: 0 }, { color: '#0B1B2A', position: 0.62 }],
  css: 'radial-gradient(circle at 50% 32%, #1F4A66 0%, #0B1B2A 62%)',
};

const IUCN_LABELS: Record<string, string> = { VU: 'Vulnerable', EN: 'En peligro', CR: 'En peligro crítico' };

/** RevelarCromado / RevelarDiamante: el cromo sale sobre fondo de noche, con destellos. */
function Reveal({ entry, result, onClose, onOpenSpecies }: Props & { entry: AlbumEntry; result: Validated }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const diamond = result.category === 'diamond';
  const accent = diamond ? '#BFE3F2' : '#F2EAB8';
  const soft = diamond ? '#C3D6E0' : colors.onRevealSecondary;
  const label = CATEGORY_LABELS[result.category];
  const reason = CATEGORY_REASONS[result.category];
  const why =
    result.chromed === 'photos'
      ? `Con ${PHOTOS_FOR_CHROME} fotos validadas, su sticker pasó a cromo ${label}${reason ? `, ${reason}` : ''}.`
      : result.chromed === 'trade'
        ? `Lo conseguiste por intercambio: cromo ${label}.`
        : diamond
          ? 'Salió en diamante porque es una especie amenazada.'
          : `Al completar un sticker puede salir cromado al azar. Este es ${label}${reason ? `, ${reason}` : ', la categoría base'}.`;

  return (
    <GradientView gradient={diamond ? DIAMOND_NIGHT : colors.reveal} style={styles.fill}>
      <StatusBar style="light" />
      <View style={[styles.raysWrap, { top: insets.top - 20 }]} pointerEvents="none">
        <Rays size={600} color={diamond ? 'rgba(191,227,242,0.09)' : 'rgba(255,255,255,0.07)'} fade={diamond ? '#0B1B2A' : colors.reveal.stops[colors.reveal.stops.length - 1]!.color} step={diamond ? 6 : 8} />
      </View>
      <ScrollView contentContainerStyle={[styles.revealContent, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing[6] }]}>
        <View style={styles.resultTop}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={styles.closeButton}>
            <Icon name="close" color="#F3EDE2" size={22} strokeWidth={2} />
          </Pressable>
          {result.completed && (
            <View style={styles.darkPill}>
              <ThemedText variant="captionStrong" style={{ color: '#F3EDE2' }}>Nueva especie · {result.registered} de {result.total}</ThemedText>
            </View>
          )}
          <View style={styles.closeButton} />
        </View>

        <View style={styles.stickerStage}>
          <Sparkles width={Math.min(width, 390)} colors={diamond ? ['#FFFFFF', '#BFE3F2'] : HOLOGRAPHIC.colors.slice(0, 5)} />
          <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.tilt, { boxShadow: `0 0 30px ${diamond ? 'rgba(159,211,234,0.55)' : 'rgba(197,217,245,0.45)'}` }]}>
            <SpeciesSticker entry={entryAfter(entry, result)} size={diamond ? 200 : 216} />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(250)} style={styles.revealText} accessibilityRole="summary" accessibilityLiveRegion="polite">
          <ThemedText variant="eyebrow" style={[styles.textCenter, { color: accent }]}>{CHROME_TITLES[result.category]}</ThemedText>
          <ThemedText variant="reveal" style={styles.whiteCenter}>{entry.species.commonName}</ThemedText>
          <ThemedText variant="scientific" style={[styles.textCenter, { color: soft }]}>{entry.species.scientificName}</ThemedText>
          {diamond && entry.species.iucn && (
            <View style={[styles.lightChip, { backgroundColor: '#BFE3F2' }]}>
              <ThemedText variant="captionStrong" style={{ color: '#0B1B2A' }}>Amenazada · {IUCN_LABELS[entry.species.iucn] ?? entry.species.iucn}</ThemedText>
            </View>
          )}
          <ThemedText style={[styles.centerText, { color: soft }]}>{why}</ThemedText>
        </Animated.View>

        {diamond && (
          <View style={[styles.darkCard, styles.row]}>
            <Icon name="shield" color="#BFE3F2" size={22} />
            <View style={styles.flex}>
              <ThemedText variant="bodyStrong" style={styles.white}>Obsérvalo de lejos</ThemedText>
              <ThemedText variant="small" style={{ color: soft }}>No te acerques a dormideros ni nidos. En especies amenazadas no guardamos ni compartimos la ubicación.</ThemedText>
            </View>
          </View>
        )}

        {result.achievements.length > 0 && <Achievements achievements={result.achievements} dark />}
        {result.completed && <PosterProgress registered={result.registered} total={result.total} dark />}

        <View style={styles.actions}>
          <Button label="Ver en el álbum" variant="light" onPress={() => onOpenSpecies(entry.species.id)} />
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.ghostLight}>
            <ThemedText variant="button" style={{ color: '#F3EDE2' }}>Seguir explorando</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </GradientView>
  );
}

/** Destellos del diseño alrededor del sticker revelado. */
function Sparkles({ width, colors }: { width: number; colors: readonly string[] }) {
  const k = width / 390;
  const star = (x: number, y: number, s: number) => `M${x} ${y - s} L${x + s * 0.25} ${y - s * 0.25} L${x + s} ${y} L${x + s * 0.25} ${y + s * 0.25} L${x} ${y + s} L${x - s * 0.25} ${y + s * 0.25} L${x - s} ${y} L${x - s * 0.25} ${y - s * 0.25} Z`;
  const c = (i: number) => colors[i % colors.length]!;
  return (
    <Svg width={width} height={318 * k} viewBox="0 0 390 318" style={styles.sparkles} pointerEvents="none">
      <Path d={star(70, 84, 14)} fill={c(3)} />
      <Path d={star(322, 62, 10)} fill={c(1)} />
      <Path d={star(336, 242, 12)} fill={c(0)} />
      <Path d={star(52, 244, 8)} fill={c(2)} />
      <Circle cx={104} cy={150} r={3} fill={c(4)} />
      <Circle cx={296} cy={160} r={2.5} fill={c(3)} />
      <Circle cx={250} cy={34} r={2.5} fill={c(2)} />
    </Svg>
  );
}

/** RegistrarCompletado: especie nueva con sticker normal, y cómo conseguir su cromo. */
function Completed({ entry, result, onOpenSpecies, onRegisterAnother, onClose }: Props & { entry: AlbumEntry; result: Validated }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <View style={[styles.raysWrap, { top: insets.top - 60 }]} pointerEvents="none">
        <Rays size={600} color={colors.surfaceAlt} fade={colors.background} />
      </View>
      <ScrollView contentContainerStyle={[styles.revealContent, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing[6] }]}>
        <View style={styles.resultTop}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={styles.closeButton}>
            <Icon name="close" color={colors.text} size={22} strokeWidth={2} />
          </Pressable>
          <View style={[styles.lightPill, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <ThemedText variant="captionStrong">Especie nueva · {result.registered} de {result.total}</ThemedText>
          </View>
          <View style={styles.closeButton} />
        </View>
        <View style={[styles.stickerStage, { height: 262 }]}>
          <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.tilt}>
            <SpeciesSticker entry={entryAfter(entry, result)} size={186} />
          </Animated.View>
        </View>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.revealText} accessibilityRole="summary" accessibilityLiveRegion="polite">
          <ThemedText variant="eyebrow" color="primary" style={styles.textCenter}>¡Sticker completado!</ThemedText>
          <ThemedText variant="reveal" style={styles.textCenter}>{entry.species.commonName}</ThemedText>
          <ThemedText variant="scientific" color="textSecondary" style={styles.textCenter}>{entry.species.scientificName}</ThemedText>
          <ThemedText variant="label" color="textSecondary" style={styles.textCenter}>Esta vez salió normal</ThemedText>
        </Animated.View>

        {result.achievements.length > 0 && <Achievements achievements={result.achievements} />}
        <PosterProgress registered={result.registered} total={result.total} />

        <View style={[styles.waysCard, { borderColor: colors.border }]}>
          <ThemedText variant="bodyStrong">Otras formas de conseguir su cromo {CATEGORY_LABELS[result.category]}</ThemedText>
          <Pressable accessibilityRole="link" onPress={() => onOpenSpecies(entry.species.id)} style={styles.way}>
            <View style={styles.holoBadge}>
              <Svg width={32} height={32} viewBox="0 0 32 32">
                {HOLOGRAPHIC.colors.slice(0, 5).map((color, i) => (
                  <Path key={i} d={`M16 16 L${16 + 16 * Math.sin((i * 72 * Math.PI) / 180)} ${16 - 16 * Math.cos((i * 72 * Math.PI) / 180)} A16 16 0 0 1 ${16 + 16 * Math.sin(((i + 1) * 72 * Math.PI) / 180)} ${16 - 16 * Math.cos(((i + 1) * 72 * Math.PI) / 180)} Z`} fill={color} />
                ))}
              </Svg>
              <View style={styles.wayIcon}>
                <Icon name="camera" color="#14302F" size={16} strokeWidth={2} />
              </View>
            </View>
            <View style={styles.flex}>
              <ThemedText variant="bodyStrong">Sube {PHOTOS_FOR_CHROME} fotos validadas</ThemedText>
              <ThemedText variant="caption" color="textSecondary">Llevas {result.validPhotos} de {PHOTOS_FOR_CHROME}</ThemedText>
            </View>
          </Pressable>
          <View style={styles.way}>
            <View style={[styles.plainBadge, { backgroundColor: colors.surfaceAlt }]}>
              <Icon name="swap" color={colors.text} size={16} strokeWidth={2} />
            </View>
            <View style={styles.flex}>
              <ThemedText variant="bodyStrong">Pídelo en intercambio</ThemedText>
              <ThemedText variant="caption" color="textSecondary">A alguien que ya lo tenga</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.pairActions}>
          <View style={styles.flex}>
            <Button label="Ver en el álbum" onPress={() => onOpenSpecies(entry.species.id)} />
          </View>
          <View style={styles.flex}>
            <Button label="Registrar otra" variant="secondary" onPress={onRegisterAnother} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Otra foto de una especie que ya estaba en el álbum: va a su galería y suma para el cromo. */
function AddedToGallery({ entry, result, onOpenSpecies, onRegisterAnother, onClose }: Props & { entry: AlbumEntry; result: Validated }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const remaining = Math.max(0, PHOTOS_FOR_CHROME - result.validPhotos);
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.revealContent, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing[6] }]}>
      <View style={styles.resultTop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={styles.closeButton}>
          <Icon name="close" color={colors.text} size={22} strokeWidth={2} />
        </Pressable>
      </View>
      <View style={[styles.stickerStage, { height: 240 }]}>
        <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.tilt}>
          <SpeciesSticker entry={entryAfter(entry, result)} size={160} />
        </Animated.View>
      </View>
      <View style={styles.revealText} accessibilityRole="summary" accessibilityLiveRegion="polite">
        <ThemedText variant="eyebrow" color="primary" style={styles.textCenter}>Foto validada</ThemedText>
        <ThemedText variant="title" style={styles.textCenter}>Se sumó a la galería de {entry.species.commonName}</ThemedText>
        <ThemedText color="textSecondary" style={styles.centerText}>
          {result.chromed || entry.sticker?.chrome
            ? 'Ya tiene su cromo: las fotos siguientes quedan en su galería.'
            : remaining === 1
              ? `Una foto válida más y su sticker pasa a cromo ${CATEGORY_LABELS[result.category]}.`
              : `${remaining} fotos válidas más y su sticker pasa a cromo ${CATEGORY_LABELS[result.category]}.`}
        </ThemedText>
      </View>
      {!entry.sticker?.chrome && (
        <View style={[styles.lightCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <ProgressBar label="Cromo por fotos" current={result.validPhotos} total={PHOTOS_FOR_CHROME} valueText={`${result.validPhotos} de ${PHOTOS_FOR_CHROME} validadas`} />
        </View>
      )}
      <View style={styles.pairActions}>
        <View style={styles.flex}>
          <Button label="Ver su galería" onPress={() => onOpenSpecies(entry.species.id)} />
        </View>
        <View style={styles.flex}>
          <Button label="Registrar otra" variant="secondary" onPress={onRegisterAnother} />
        </View>
      </View>
    </ScrollView>
  );
}

function Rejected({ entry, reason, onRetry, onClose }: Props & { entry: AlbumEntry; reason: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Icon name="alert" color={colors.error} size={44} strokeWidth={1.8} />
      <ThemedText variant="title" style={styles.textCenter}>La IA no reconoció la especie</ThemedText>
      <ThemedText color="textSecondary" style={styles.centerText}>{reason} No se sumó al álbum.</ThemedText>
      <View style={styles.stackActions}>
        <Button label={`Probar con otra foto de ${entry.species.commonName}`} onPress={() => onRetry(entry.species.id)} />
        <Button label="Cerrar" variant="tertiary" onPress={onClose} />
      </View>
    </View>
  );
}

function medalKind(a: Achievement): MedalKind {
  return a.kind === 'habitatComplete' ? a.habitat : a.kind;
}

function achievementLabel(a: Achievement): string {
  switch (a.kind) {
    case 'firstBird': return 'Primera ave';
    case 'explorer': return 'Explorador de Ica';
    case 'milestone': return `${a.species} especies`;
    case 'habitatComplete': return HABITAT_MEDALS[a.habitat].title;
    case 'albumComplete': return 'Álbum completo';
  }
}

/** «Ganaste»: las medallas que dio esta foto (la celebración completa está en Recompensas). */
function Achievements({ achievements, dark = false }: { achievements: readonly Achievement[]; dark?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[dark ? styles.darkCard : [styles.lightCard, { backgroundColor: colors.surface, borderColor: colors.line }], styles.medals]}>
      <ThemedText variant="bodyStrong" style={dark ? styles.white : undefined}>
        {achievements.length === 1 ? '¡Ganaste una medalla!' : `¡Ganaste ${achievements.length} medallas!`}
      </ThemedText>
      <View style={styles.medalRow}>
        {achievements.map((a) => (
          <View key={achievementId(a)} style={styles.medalItem}>
            <Medal kind={medalKind(a)} number={a.kind === 'milestone' ? a.species : undefined} size={52} />
            <ThemedText variant="caption" style={[styles.textCenter, dark ? styles.white : undefined]}>{achievementLabel(a)}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

/** «Póster 2 · 13 de 20 especies»: cuánto falta para el próximo póster y su medalla. */
function PosterProgress({ registered, total, dark = false }: { registered: number; total: number; dark?: boolean }) {
  const { colors } = useTheme();
  const next = nextPoster(registered, total);
  if (!next) return null;
  const goal = next.number * SPECIES_PER_POSTER;
  return (
    <View style={dark ? styles.darkCard : [styles.lightCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.posterHead}>
        <ThemedText variant="label" style={dark ? styles.white : undefined}>Póster {next.number}</ThemedText>
        <ThemedText variant="label" style={dark ? styles.white : undefined}>{registered} de {goal} especies</ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: dark ? 'rgba(243,237,226,0.16)' : colors.track }]}>
        <View style={[styles.trackFill, { width: `${(registered / goal) * 100}%`, backgroundColor: dark ? colors.sun : colors.text }]} />
      </View>
      <ThemedText variant="caption" style={{ color: dark ? colors.onRevealSecondary : colors.textSecondary }}>
        Te faltan {next.remaining} para tu próximo póster y la medalla de {goal}.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    padding: spacing[6],
  },
  centerText: {
    textAlign: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
  white: {
    color: '#FFFFFF',
  },
  whiteCenter: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  raysWrap: {
    position: 'absolute',
    alignSelf: 'center',
  },
  revealContent: {
    gap: 14,
  },
  resultTop: {
    height: layout.header,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkPill: {
    borderRadius: 999,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    backgroundColor: 'rgba(243,237,226,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(243,237,226,0.24)',
  },
  lightPill: {
    borderRadius: 999,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderWidth: 1,
  },
  stickerStage: {
    height: 318,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkles: {
    position: 'absolute',
    top: 0,
  },
  tilt: {
    transform: [{ rotate: '-4deg' }],
    borderRadius: 14,
  },
  // Los textos van a todo el ancho y centrados: con alignItems center, Android los mide por su
  // ancho intrínseco y a veces corta la segunda palabra (pasaba con el nombre científico en itálica).
  revealText: {
    gap: 4,
    paddingHorizontal: 28,
  },
  lightChip: {
    alignSelf: 'center',
    marginTop: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  darkCard: {
    marginHorizontal: layout.textMargin,
    padding: spacing[3],
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(243,237,226,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(243,237,226,0.16)',
    gap: spacing[2],
  },
  lightCard: {
    marginHorizontal: layout.cardMargin,
    padding: spacing[3],
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  posterHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  medals: {
    alignItems: 'center',
  },
  medalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[4],
  },
  medalItem: {
    width: 88,
    alignItems: 'center',
    gap: 4,
  },
  waysCard: {
    marginHorizontal: layout.cardMargin,
    padding: spacing[3],
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: spacing[2],
  },
  way: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  holoBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  wayIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plainBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    marginTop: spacing[2],
    paddingHorizontal: layout.textMargin,
    gap: 10,
  },
  ghostLight: {
    minHeight: 48,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: 'rgba(243,237,226,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairActions: {
    marginTop: spacing[2],
    paddingHorizontal: layout.cardMargin,
    flexDirection: 'row',
    gap: 10,
  },
  stackActions: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: spacing[2],
  },
});
