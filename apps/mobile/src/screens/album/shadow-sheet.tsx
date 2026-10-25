import { StyleSheet, View } from 'react-native';

import { formatAlbumNumber, type AlbumEntry } from '@plumario/core';
import { radius, spacing } from '@plumario/tokens';
import { Button, Sheet, TextLink, ThemedText, useTheme } from '@plumario/ui';

import { SpeciesSticker } from '@/components/species-sticker';
import { ALBUM_HABITAT_LABELS } from '@/constants/habitats';

export type PhotoSource = 'camera' | 'gallery';

type Props = {
  entry: AlbumEntry | null;
  onClose: () => void;
  onAddPhoto: (entry: AlbumEntry, source: PhotoSource) => void;
};

/** AlbumSilueta: la hoja de un sticker vacío, para completarlo con una foto. */
export function ShadowSheet({ entry, onClose, onAddPhoto }: Props) {
  const { colors } = useTheme();
  const species = entry?.species;
  return (
    <Sheet visible={!!entry} onClose={onClose} label={species ? `${species.commonName}, sticker vacío` : ''}>
      {entry && species && (
        <>
          <View style={styles.head}>
            <SpeciesSticker entry={entry} size={112} />
            <View style={styles.titles}>
              <ThemedText variant="eyebrow" color="primary">
                N.º {formatAlbumNumber(species.albumNumber)}{species.habitat ? ` · ${ALBUM_HABITAT_LABELS[species.habitat]}` : ''}
              </ThemedText>
              <ThemedText variant="heading" accessibilityRole="header">{species.commonName}</ThemedText>
              <ThemedText variant="scientific" color="textSecondary" style={styles.scientific}>{species.scientificName}</ThemedText>
              <View style={[styles.emptyPill, { borderColor: colors.border }]}>
                <ThemedText variant="captionStrong" color="textSecondary">Sticker vacío</ThemedText>
              </View>
            </View>
          </View>
          <ThemedText variant="small" color="textSecondary">
            Completa este sticker con una foto tuya. La IA revisa que sea esta especie antes de guardarla.
          </ThemedText>
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button label="Tomar foto" icon="camera" onPress={() => onAddPhoto(entry, 'camera')} />
            </View>
            <View style={styles.action}>
              <Button label="De la galería" icon="image" variant="secondary" onPress={() => onAddPhoto(entry, 'gallery')} />
            </View>
          </View>
          <View style={styles.close}>
            <TextLink label="Cerrar" onPress={onClose} />
          </View>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  titles: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  scientific: {
    fontSize: 17,
    lineHeight: 21,
  },
  emptyPill: {
    alignSelf: 'flex-start',
    marginTop: spacing[1],
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
  },
  close: {
    alignItems: 'center',
  },
});
