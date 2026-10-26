import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PHOTOS_FOR_CHROME, formatAlbumNumber, photosToChrome, type AlbumEntry, type AlbumView } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, Card, Icon, ListRow, ProgressBar, StatusBarScrim, ThemedText, useTheme } from '@plumario/ui';

import { SpeciesSkeleton } from '@/components/screen-skeletons';
import { SpeciesSticker } from '@/components/species-sticker';
import { CATEGORY_LABELS, CATEGORY_REASONS, formatShortDate } from '@/constants/cards';
import { HABITAT_LABELS, stickerTint } from '@/constants/habitats';
import { useAlbum } from '@/hooks/use-album';

import type { PhotoSource } from './album/shadow-sheet';
import { SpeciesPhotos } from './species-photos';

type Props = {
  speciesId: string;
  onBack: () => void;
  onOpenSticker: (speciesId: string) => void;
  onAddPhoto: (speciesId: string, source: PhotoSource) => void;
};

/** El color de la barra «Cromo por fotos», del metal de la categoría. */
const CATEGORY_BAR = { holographic: '#8FA9D8', silver: '#7E8B95', gold: '#B9872A', ruby: '#A51E36', diamond: '#4F93B5' } as const;

/** GaleriaEspecie: la especie que ya tienes, cuánto le falta para cromo y tus fotos. */
export function SpeciesGallery({ speciesId, onBack, onOpenSticker, onAddPhoto }: Props) {
  const state = useAlbum();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const entry = state.status === 'ready' ? state.album.entries.find((e) => e.species.id === speciesId) : undefined;

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + spacing[6] }}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={styles.back}>
            <Icon name="back" color={colors.text} size={22} strokeWidth={2} />
          </Pressable>
          {entry && (
            <ThemedText variant="eyebrow" color="primary" style={styles.eyebrow}>
              {entry.species.habitat ? `${HABITAT_LABELS[entry.species.habitat]} · ` : ''}N.º {formatAlbumNumber(entry.species.albumNumber)}
            </ThemedText>
          )}
        </View>
        {state.status === 'loading' && <SpeciesSkeleton inset />}
        {state.status === 'error' && <ThemedText color="error" style={styles.message}>No se pudo cargar el álbum. Revisa tu conexión.</ThemedText>}
        {state.status === 'ready' && !entry && <ThemedText color="textSecondary" style={styles.message}>Esta especie no está en el álbum.</ThemedText>}
        {state.status === 'ready' && entry && <GalleryContent entry={entry} album={state.album} onOpenSticker={onOpenSticker} onAddPhoto={onAddPhoto} />}
      </ScrollView>
      <StatusBarScrim />
    </>
  );
}

function GalleryContent({ entry, album, onOpenSticker, onAddPhoto }: { entry: AlbumEntry; album: AlbumView } & Pick<Props, 'onOpenSticker' | 'onAddPhoto'>) {
  const { mode, colors } = useTheme();
  const { species, sticker, category } = entry;
  // Es tu primera ave si ninguna otra se completó antes.
  const first = !!sticker && album.entries.every((e) => !e.sticker || e.sticker.completedAt >= sticker.completedAt);
  const remaining = sticker ? photosToChrome(sticker) : PHOTOS_FOR_CHROME;
  const label = CATEGORY_LABELS[category];
  const reason = CATEGORY_REASONS[category];

  return (
    <View style={styles.content}>
      <View style={[styles.hero, { backgroundColor: mode === 'dark' ? colors.surfaceAlt : stickerTint(species.habitat) }]}>
        <View style={styles.tilt}>
          <SpeciesSticker entry={entry} size={104} />
        </View>
        <View style={styles.heroText}>
          <ThemedText variant="title" accessibilityRole="header" style={mode === 'dark' ? undefined : styles.onTint}>{species.commonName}</ThemedText>
          <ThemedText variant="scientific" style={mode === 'dark' ? { color: colors.textSecondary } : styles.onTintSecondary}>{species.scientificName}</ThemedText>
          {sticker && (
            <View style={[styles.datePill, { backgroundColor: colors.background }]}>
              <ThemedText variant="captionStrong" color="success">
                {first ? 'Tu primera ave' : 'Registrada'} · {formatShortDate(sticker.completedAt)}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {sticker && (
        <Card style={styles.chromeCard}>
          {sticker.chrome ? (
            <>
              <ThemedText variant="bodyStrong">Ya es cromo {label}</ThemedText>
              <ThemedText variant="caption" color="textSecondary">Su sticker ocupa la casilla del álbum con el acabado {label}.</ThemedText>
            </>
          ) : (
            <>
              <ProgressBar
                label="Cromo por fotos"
                current={sticker.validPhotos}
                total={PHOTOS_FOR_CHROME}
                valueText={`${sticker.validPhotos} de ${PHOTOS_FOR_CHROME} validadas`}
                color={CATEGORY_BAR[category]}
              />
              <ThemedText variant="caption" color="textSecondary">
                {remaining === 1 ? 'Una foto válida más' : `${remaining} fotos válidas más`} y su sticker pasa a cromo {label}
                {reason ? `, ${reason}` : ''}. La IA revisa que se vea esta especie.
              </ThemedText>
            </>
          )}
        </Card>
      )}

      {sticker && <ListRow title="Ver sticker" detail={sticker.chrome ? `Cromo ${label}` : 'Sticker normal'} onPress={() => onOpenSticker(species.id)} />}

      <View style={styles.galleryHeader}>
        <View style={styles.galleryTitle}>
          <ThemedText variant="section">Tu galería · {sticker?.validPhotos ?? 0} {sticker?.validPhotos === 1 ? 'foto' : 'fotos'}</ThemedText>
          <ThemedText variant="caption" color="textSecondary">Completas, sin recortes. No suman especies.</ThemedText>
        </View>
        <Button label="Agregar" icon="camera" variant="secondary" onPress={() => onAddPhoto(species.id, 'camera')} />
      </View>
      <SpeciesPhotos speciesId={species.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: layout.header,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    paddingRight: spacing[3],
  },
  message: {
    marginHorizontal: layout.cardMargin,
  },
  content: {
    paddingHorizontal: layout.cardMargin,
    gap: spacing[3],
  },
  hero: {
    minHeight: 168,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 14,
    paddingRight: spacing[4],
    paddingVertical: spacing[3],
    overflow: 'hidden',
  },
  tilt: {
    transform: [{ rotate: '-4deg' }],
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  // Sobre el tinte claro de la placa, el texto va siempre oscuro (como en el sticker).
  onTint: {
    color: '#14302F',
  },
  onTintSecondary: {
    color: '#3F504E',
  },
  datePill: {
    alignSelf: 'flex-start',
    marginTop: 2,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chromeCard: {
    paddingVertical: spacing[3],
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginTop: spacing[1],
  },
  galleryTitle: {
    flex: 1,
    gap: 1,
  },
});
