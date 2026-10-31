import { useState, type ComponentProps } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { achievementId, formatAlbumNumber, type AlbumView, type EarnedAchievement, lastUnlocked } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, ScaledFrame, SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH, ShareCard, Switch, ThemedText, TopBar, useTheme } from '@plumario/ui';

import { useOffscreenCapture } from '@/components/offscreen-capture';
import { PosterSkeleton } from '@/components/screen-skeletons';
import { achievementLabel, achievementTitle, medalKind } from '@/constants/achievements';
import { formatShortDate } from '@/constants/cards';
import { stickerTint } from '@/constants/habitats';
import { STICKER_ART } from '@/constants/sticker-art';
import { useAchievements } from '@/hooks/use-achievements';
import { useAlbum } from '@/hooks/use-album';
import { useSpeciesPhotos } from '@/hooks/use-species-photos';
import { captureImage, saveImageToPhotos, shareFile } from '@/utils/export-image';

export type ShareSubject = { kind: 'sticker'; speciesId: string } | { kind: 'medal'; achievementId: string };

type Props = {
  subject: ShareSubject;
  /** «Compartir con mi foto»: llega con la foto puesta. */
  withPhoto?: boolean;
  onBack: () => void;
};

type CardProps = ComponentProps<typeof ShareCard>;

/**
 * CompartirTarjeta: la tarjeta de un sticker (con la foto propia, si se quiere) o de una medalla,
 * para compartir o guardar en las fotos. Nunca lleva la ubicación.
 */
export function ShareCardScreen({ subject, withPhoto = false, onBack }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const state = useAlbum();
  const records = useAchievements();
  const photosState = useSpeciesPhotos(subject.kind === 'sticker' ? subject.speciesId : '');
  const [usePhoto, setUsePhoto] = useState(withPhoto);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const album = state.status === 'ready' ? state.album : null;
  const photos = subject.kind === 'sticker' && photosState.status === 'ready' ? photosState.photos.filter((p) => p.status === 'validated') : [];
  const photoUri = usePhoto ? (photos[photoIndex] ?? photos[0])?.url ?? null : null;
  const card = album ? cardFor(subject, album, records ?? [], photoUri) : null;
  const content = card ? <ShareCard {...card} /> : null;
  const { element, run } = useOffscreenCapture(content, { baseWidth: SHARE_CARD_WIDTH, baseHeight: SHARE_CARD_HEIGHT, exportWidth: SHARE_CARD_WIDTH });

  async function act(kind: 'share' | 'save') {
    if (!card) return;
    setBusy(kind);
    setMessage(null);
    try {
      const uri = await run((view) => captureImage(view, { width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT, caption: card.name }));
      if (kind === 'share') await shareFile(uri, 'image/png', card.name);
      else setMessage((await saveImageToPhotos(uri)) ? { text: 'Guardada en tus fotos.' } : { text: 'Para guardarla, permite que Plumario acceda a tus fotos.', error: true });
    } catch {
      setMessage({ text: 'No se pudo preparar la imagen. Vuelve a intentar.', error: true });
    } finally {
      setBusy(null);
    }
  }

  const loading = !album || (subject.kind === 'medal' && !records);
  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Compartir" onBack={onBack} />
      {loading && <PosterSkeleton inset />}
      {!loading && !card && <ThemedText color="textSecondary" style={styles.message}>Todavía no tienes este logro para compartir.</ThemedText>}
      {card && (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={[styles.stage, { backgroundColor: colors.surfaceAlt }]}>
              <ScaledFrame baseWidth={SHARE_CARD_WIDTH} baseHeight={SHARE_CARD_HEIGHT} width={262} style={styles.preview}>
                {content}
              </ScaledFrame>
            </View>
            {subject.kind === 'sticker' && (
              <View style={[styles.controls, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Switch
                  label="Agregar mi foto"
                  description={photos.length ? 'Junto a la figura del ave' : 'Aún no tienes fotos validadas de esta especie'}
                  value={usePhoto && photos.length > 0}
                  onChange={setUsePhoto}
                  disabled={photos.length === 0}
                />
                {usePhoto && photos.length > 1 && (
                  <View accessibilityRole="radiogroup" accessibilityLabel="Elegir foto de tu galería" style={styles.photos}>
                    {photos.slice(0, 4).map((photo, i) => {
                      const selected = i === photoIndex;
                      return (
                        <Pressable
                          key={photo.sightingId}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selected }}
                          accessibilityLabel={`Foto ${i + 1}`}
                          onPress={() => setPhotoIndex(i)}
                          style={[styles.photoOption, selected ? { borderWidth: 3, borderColor: colors.text } : { borderWidth: 1, borderColor: colors.line }]}>
                          <Image source={{ uri: photo.url }} style={styles.photoThumb} />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
            {message && (
              <ThemedText variant="small" color={message.error ? 'error' : 'success'} style={styles.feedback} accessibilityLiveRegion="polite">
                {message.text}
              </ThemedText>
            )}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
            <Button label="Compartir" icon="share" onPress={() => void act('share')} busy={busy === 'share'} disabled={!!busy} />
            <Button label="Guardar imagen" icon="download" variant="secondary" onPress={() => void act('save')} busy={busy === 'save'} disabled={!!busy} />
          </View>
          {element}
        </>
      )}
    </View>
  );
}

/** Los textos y el dibujo de la tarjeta (TarjetaLogro) según lo que se comparte. */
function cardFor(
  subject: ShareSubject,
  album: AlbumView,
  records: readonly EarnedAchievement[],
  photoUri: string | null,
): CardProps | null {
  const progress = `${album.registered} de ${album.total} especies`;
  if (subject.kind === 'medal') {
    const record = records.find((r) => achievementId(r.achievement) === subject.achievementId);
    if (!record) return null;
    const { achievement } = record;
    return {
      art: { medal: { kind: medalKind(achievement), number: achievement.kind === 'milestone' ? achievement.species : undefined } },
      badge: '¡Medalla nueva!',
      name: achievementLabel(achievement),
      scientificName: achievementTitle(achievement),
      meta: [formatShortDate(record.earnedAt), progress],
    };
  }
  const entry = album.entries.find((e) => e.species.id === subject.speciesId);
  if (!entry?.sticker) return null;
  const { species, sticker, finish } = entry;
  const unlocked = lastUnlocked(sticker);
  // «Cromo 2»: el segundo cromo que consiguió, por fecha.
  const chromes = album.entries.filter((e) => e.finish).sort((a, b) => a.sticker!.unlocked[0]!.at.getTime() - b.sticker!.unlocked[0]!.at.getTime());
  return {
    art: { sticker: { figure: species.figure, name: species.commonName, number: formatAlbumNumber(species.albumNumber), tint: stickerTint(species.habitat), finish: finish ?? 'normal', art: STICKER_ART[species.id] } },
    badge: finish ? '¡Subí de acabado!' : '¡Nuevo en mi álbum!',
    name: species.commonName,
    scientificName: species.scientificName,
    meta: [
      formatShortDate(unlocked?.at ?? sticker.completedAt),
      finish ? `Cromo ${chromes.findIndex((e) => e.species.id === species.id) + 1}` : `N.º ${formatAlbumNumber(species.albumNumber)}`,
      progress,
    ],
    photoUri,
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  message: {
    marginHorizontal: layout.textMargin,
  },
  content: {
    gap: 14,
    paddingBottom: spacing[4],
  },
  stage: {
    marginHorizontal: layout.cardMargin,
    height: 356,
    borderRadius: radius.hero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    borderRadius: 6,
    boxShadow: '0 2px 4px rgba(20,48,47,0.2), 0 14px 30px rgba(20,48,47,0.22)',
  },
  controls: {
    marginHorizontal: layout.cardMargin,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  photos: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  photoOption: {
    width: 72,
    height: 56,
    borderRadius: 10,
    padding: 2,
  },
  photoThumb: {
    flex: 1,
    borderRadius: 7,
  },
  feedback: {
    marginHorizontal: layout.textMargin,
  },
  footer: {
    paddingHorizontal: layout.cardMargin,
    paddingTop: spacing[2],
    gap: 10,
  },
});
