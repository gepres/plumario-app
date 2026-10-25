import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { postersView } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { Button, Icon, PosterFrame, SpeciesPoster, ThemedText, useTheme } from '@plumario/ui';

import { speciesPosterProps } from '@/components/poster-content';
import { PosterExportActions } from '@/components/poster-export-actions';
import { useAlbum } from '@/hooks/use-album';
import { usePosters } from '@/hooks/use-posters';
import { useCollectorName } from '@/hooks/use-profile';

type Props = {
  posterId: string;
  onClose: () => void;
};

/** PosterListo: el póster guardado, para descargar en PDF o PNG, o compartir. */
export function PosterReady({ posterId, onClose }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const state = useAlbum();
  const posters = usePosters();
  const collector = useCollectorName();
  const poster = posters?.find((p) => p.id === posterId);
  const album = state.status === 'ready' ? state.album : null;

  if (!album || !posters) return <ActivityIndicator style={[styles.loading, { marginTop: insets.top + spacing[6] }]} />;
  if (!poster || poster.number === null) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing[6] }]}>
        <ThemedText color="textSecondary" style={styles.message}>No encontramos este póster.</ThemedText>
        <Button label="Volver" variant="secondary" onPress={onClose} />
      </View>
    );
  }
  const content = <SpeciesPoster {...speciesPosterProps(album, { ...poster, number: poster.number }, collector)} />;
  // Lo que sigue: otro póster ya listo para armar o la meta del próximo.
  const slots = postersView(album, posters).species;
  const ready = slots.find((s) => s.status === 'ready');
  const upcoming = slots.find((s) => s.status === 'next');
  const next = ready ? ` El Póster ${ready.number} ya está listo para armar.` : upcoming?.status === 'next' ? ` El próximo llega a las ${upcoming.goal} especies.` : '';

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing[6] }]}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={styles.close}>
          <Icon name="close" color={colors.text} size={22} strokeWidth={2} />
        </Pressable>
      </View>
      <View style={styles.stage}>
        <Svg width={300} height={300} style={styles.glow} pointerEvents="none">
          <Defs>
            <RadialGradient id="glow" cx={150} cy={150} r={150} gradientUnits="userSpaceOnUse">
              <Stop offset={0} stopColor={colors.surfaceAlt} stopOpacity={1} />
              <Stop offset={0.7} stopColor={colors.surfaceAlt} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={300} height={300} fill="url(#glow)" />
        </Svg>
        <View style={styles.tilt}>
          <PosterFrame width={214} style={styles.poster}>
            {content}
          </PosterFrame>
        </View>
      </View>
      <View style={styles.status} accessibilityRole="summary">
        <ThemedText variant="eyebrow" color="success" style={styles.center}>Póster guardado</ThemedText>
        <ThemedText variant="title" style={styles.center}>Póster {poster.number} · {poster.title}</ThemedText>
        <ThemedText variant="small" color="textSecondary" style={styles.center}>
          Queda en Mis recompensas.{next}
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <PosterExportActions poster={content} caption={`Póster ${poster.number} · ${poster.title}`} />
        <Button label="Volver a pósteres" variant="tertiary" onPress={onClose} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: layout.cardMargin,
    gap: spacing[3],
  },
  loading: {
    alignSelf: 'center',
  },
  message: {
    textAlign: 'center',
  },
  content: {
    gap: spacing[3],
  },
  topBar: {
    height: layout.header,
    paddingHorizontal: spacing[2],
    justifyContent: 'center',
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    height: 330,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  tilt: {
    transform: [{ rotate: '-3deg' }],
  },
  poster: {
    borderRadius: 3,
    boxShadow: '0 2px 4px rgba(20,48,47,0.2), 0 18px 36px rgba(20,48,47,0.24)',
  },
  status: {
    paddingHorizontal: spacing[6],
    gap: 4,
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: layout.cardMargin,
    gap: 10,
    marginTop: spacing[2],
  },
});
