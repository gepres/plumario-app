import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEFAULT_REGION_ID, homeView, regionById, rewardsView, SPECIES_PER_POSTER, type AlbumEntry, type AlbumView, type Habitat } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { Button, GradientView, Icon, PosterFrame, ProgressBar, SpeciesPoster, StatusBarScrim, ThemedText, useTheme } from '@plumario/ui';

import { DEFAULT_POSTER_TITLE, speciesPosterProps } from '@/components/poster-content';
import { SpeciesSticker, stickerLabel } from '@/components/species-sticker';
import { HABITAT_LABELS } from '@/constants/habitats';
import { useAchievements } from '@/hooks/use-achievements';
import { useAlbum } from '@/hooks/use-album';
import { useCollectorName } from '@/hooks/use-profile';
import { useSightingQueue } from '@/hooks/use-sighting-queue';
import { ShadowSheet, type PhotoSource } from '@/screens/album/shadow-sheet';

type Props = {
  onOpenRegions: () => void;
  onOpenAlbum: () => void;
  onSearch: () => void;
  onOpenPosters: () => void;
  onOpenSticker: (speciesId: string) => void;
  onOpenHabitat: (habitat: Habitat) => void;
  onRegister: () => void;
  onAddPhoto: (speciesId: string, source: PhotoSource) => void;
};

// En minúscula en medio de una frase: «Por descubrir en el litoral».
const HABITAT_IN_SENTENCE: Record<Habitat, string> = {
  coast: 'el litoral',
  wetlands: 'los humedales',
  desert: 'el desierto',
  highlands: 'la sierra',
  openSea: 'el mar abierto',
};

/** Inicio (design/project/Inicio.dc.html e InicioVacio.dc.html). */
export function Home(props: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const state = useAlbum();
  const [sheet, setSheet] = useState<AlbumEntry | null>(null);
  const region = regionById(DEFAULT_REGION_ID)!;

  return (
    <>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[3], paddingBottom: layout.tabBar + insets.bottom + spacing[4] }]}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <ThemedText variant="eyebrow" color="primary">Álbum de aves · Edición inicial</ThemedText>
            <Pressable accessibilityRole="button" accessibilityLabel={`Aves de ${region.name}. Cambiar de región`} onPress={props.onOpenRegions} style={styles.titleButton}>
              <ThemedText variant="title" accessibilityRole="header">Aves de {region.name}</ThemedText>
              <Icon name="chevronDown" color={colors.text} size={20} strokeWidth={2.4} />
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Buscar un ave en el álbum" onPress={props.onSearch} style={styles.iconButton}>
            <Icon name="search" color={colors.text} size={22} strokeWidth={1.9} />
          </Pressable>
        </View>

        {state.status === 'loading' && <ActivityIndicator style={styles.loading} />}
        {state.status === 'error' && (
          <View style={styles.section}>
            <ThemedText color="error">No se pudo cargar tu álbum. Revisa tu conexión.</ThemedText>
            <Button label="Reintentar" variant="secondary" onPress={state.refresh} />
          </View>
        )}
        {state.status === 'ready' && <HomeContent album={state.album} regionName={region.name} onShowShadow={setSheet} {...props} />}
      </ScrollView>
      <StatusBarScrim />
      <ShadowSheet
        entry={sheet}
        onClose={() => setSheet(null)}
        onAddPhoto={(entry, source) => {
          setSheet(null);
          props.onAddPhoto(entry.species.id, source);
        }}
      />
    </>
  );
}

function HomeContent({ album, regionName, onShowShadow, ...props }: Props & { album: AlbumView; regionName: string; onShowShadow: (entry: AlbumEntry) => void }) {
  const { colors } = useTheme();
  const records = useAchievements();
  const collector = useCollectorName();
  const waiting = useSightingQueue().length;
  const view = homeView(album, DEFAULT_REGION_ID, new Date());
  const rewards = rewardsView(album, records ?? []);

  const hero = (
    <Pressable accessibilityRole="button" accessibilityLabel={`${album.registered} de ${album.total} especies de ${regionName}. Ver álbum`} onPress={props.onOpenAlbum}>
      <GradientView gradient={colors.hero} style={styles.hero}>
        <View style={styles.count}>
          <ThemedText variant="sheet" style={{ color: colors.onHero }}>{album.registered}</ThemedText>
          <ThemedText variant="bodyStrong" style={{ color: colors.onHero }}>de {album.total} especies de {regionName}</ThemedText>
        </View>
        <ProgressBar current={album.registered} total={album.total} showValue={false} onHero />
        {view.kind === 'started' && (
          <View style={styles.chips}>
            <HeroChip label={`${rewards.earned.length} ${rewards.earned.length === 1 ? 'medalla' : 'medallas'}`} />
            <HeroChip label={`${rewards.chromes} ${rewards.chromes === 1 ? 'cromo' : 'cromos'}`} />
            {view.nextMilestone && (
              <HeroChip label={`${view.nextMilestone.remaining} ${view.nextMilestone.remaining === 1 ? 'especie' : 'especies'} a la medalla de ${view.nextMilestone.goal}`} />
            )}
          </View>
        )}
      </GradientView>
    </Pressable>
  );

  // Sin señal: las fotos guardadas en el teléfono, que se suben solas.
  const waitingNote = waiting > 0 && (
    <View style={[styles.card, styles.waiting, { backgroundColor: colors.surface, borderColor: colors.border }]} accessible accessibilityLiveRegion="polite">
      <Icon name="download" color={colors.text} size={20} strokeWidth={2} />
      <View style={styles.flex}>
        <ThemedText variant="bodyStrong">{waiting === 1 ? '1 foto en espera de señal' : `${waiting} fotos en espera de señal`}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">Se suben solas cuando vuelvas a tener conexión.</ThemedText>
      </View>
    </View>
  );

  if (view.kind === 'empty') {
    return (
      <>
        {hero}
        {waitingNote}
        <View style={[styles.card, styles.firstBird, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <ThemedText variant="heading">Registra tu primera ave</ThemedText>
          <ThemedText variant="small" color="textSecondary">Fotografía cualquier ave que veas. La primera te da la medalla Mi primera ave.</ThemedText>
          <Button label="Registrar ave" icon="camera" onPress={props.onRegister} />
        </View>

        <View style={styles.section}>
          <ThemedText variant="section" accessibilityRole="header">Cómo funciona</ThemedText>
          {[
            { title: 'Completa stickers con tus fotos', detail: 'Toca una silueta del álbum o usa Registrar.' },
            { title: 'Consigue cromos', detail: 'Al azar al completar, con 5 fotos o intercambiando.' },
            { title: 'Medallas y pósteres', detail: 'Medalla y póster cada 10 especies, y un póster por hábitat completo.' },
          ].map((step, i) => (
            <View key={step.title} style={styles.step} accessible>
              <View style={[styles.stepNumber, { backgroundColor: colors.text }]}>
                <ThemedText variant="captionStrong" style={{ color: colors.background }}>{i + 1}</ThemedText>
              </View>
              <View style={styles.flex}>
                <ThemedText variant="bodyStrong">{step.title}</ThemedText>
                <ThemedText variant="caption" color="textSecondary">{step.detail}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        {view.easy.length > 0 && (
          <View style={styles.section}>
            <SectionHead title="Fáciles de ver en la ciudad" action={`Ver las ${album.total}`} onAction={props.onOpenAlbum} />
            <StickerRow entries={view.easy} size={92} onPress={onShowShadow} />
          </View>
        )}
      </>
    );
  }

  const nextPoster = Math.floor(album.registered / SPECIES_PER_POSTER) + 1;
  const posterGoal = nextPoster * SPECIES_PER_POSTER;
  return (
    <>
      {hero}
      {waitingNote}

      {posterGoal <= album.total && (
        <Pressable
          accessibilityRole="button"
          onPress={props.onOpenPosters}
          style={[styles.card, styles.poster, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <PosterFrame width={46} style={styles.posterThumb}>
            <SpeciesPoster {...speciesPosterProps(album, { number: nextPoster, seed: 7, theme: 'light', title: DEFAULT_POSTER_TITLE }, collector)} />
          </PosterFrame>
          <View style={styles.flex}>
            <ThemedText variant="bodyStrong">Póster {nextPoster}: te faltan {posterGoal - album.registered}</ThemedText>
            <ThemedText variant="caption" color="textSecondary">Cada {SPECIES_PER_POSTER} especies se arma un póster con tus aves. Llevas {album.registered}.</ThemedText>
          </View>
          <Icon name="chevronRight" color={colors.textSecondary} size={18} strokeWidth={2} />
        </Pressable>
      )}

      <View style={styles.section}>
        <SectionHead title="Tus últimas aves" action="Ver álbum" onAction={props.onOpenAlbum} />
        <View style={styles.row}>
          {view.latest.map(({ entry, isNew }) => (
            <Pressable
              key={entry.species.id}
              accessibilityRole="button"
              accessibilityLabel={`${stickerLabel(entry)}${isNew ? ', nuevo' : ''}`}
              onPress={() => props.onOpenSticker(entry.species.id)}>
              <SpeciesSticker entry={entry} size={stickerSize} />
              {isNew && (
                <View style={[styles.newBadge, { backgroundColor: colors.warning }]}>
                  <ThemedText variant="captionStrong" style={{ color: colors.background }}>Nuevo</ThemedText>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {view.discover && (
        <View style={styles.section}>
          <SectionHead
            title={`Por descubrir en ${HABITAT_IN_SENTENCE[view.discover.habitat]}`}
            action={view.discover.remaining > 0 ? `${view.discover.remaining} más` : HABITAT_LABELS[view.discover.habitat]}
            onAction={() => props.onOpenHabitat(view.discover!.habitat)}
          />
          <StickerRow entries={view.discover.entries} size={stickerSize} onPress={onShowShadow} />
        </View>
      )}
    </>
  );
}

// Tres por fila en un teléfono de 390 de ancho, como en el diseño.
const stickerSize = 104;

function HeroChip({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: 'rgba(243,237,226,0.14)' }]}>
      <ThemedText variant="captionStrong" numberOfLines={1} style={{ color: colors.onHero }}>{label}</ThemedText>
    </View>
  );
}

function SectionHead({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <View style={styles.sectionHead}>
      <ThemedText variant="section" accessibilityRole="header" style={styles.flex}>{title}</ThemedText>
      <Pressable accessibilityRole="link" onPress={onAction} style={styles.action}>
        <ThemedText variant="label" color="primary">{action}</ThemedText>
      </Pressable>
    </View>
  );
}

function StickerRow({ entries, size, onPress }: { entries: AlbumEntry[]; size: number; onPress: (entry: AlbumEntry) => void }) {
  return (
    <View style={styles.row}>
      {entries.map((entry) => (
        <Pressable key={entry.species.id} accessibilityRole="button" accessibilityLabel={stickerLabel(entry)} onPress={() => onPress(entry)}>
          <SpeciesSticker entry={entry} size={size} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.cardMargin,
    gap: spacing[3],
  },
  header: {
    paddingLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    marginTop: spacing[6],
  },
  hero: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: spacing[4],
    gap: 10,
  },
  count: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  firstBird: {
    gap: spacing[2],
  },
  waiting: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  poster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  posterThumb: {
    borderRadius: 2,
    boxShadow: '0 1px 2px rgba(20,48,47,0.2)',
  },
  section: {
    gap: spacing[2],
  },
  sectionHead: {
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  action: {
    minHeight: 32,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newBadge: {
    position: 'absolute',
    left: -4,
    bottom: -6,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
