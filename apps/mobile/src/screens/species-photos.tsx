import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { SpeciesPhoto } from '@plumario/core';
import { radius, spacing } from '@plumario/tokens';
import { Icon, ThemedText, useTheme } from '@plumario/ui';

import { StickerGridSkeleton } from '@/components/screen-skeletons';
import { formatShortDate } from '@/constants/cards';
import { useSpeciesPhotos } from '@/hooks/use-species-photos';

const WARNING = '#A0541F';

/**
 * «Tu galería» de GaleriaEspecie: las fotos completas, sin recortes, en dos columnas que se van
 * llenando por altura. La más reciente lleva «Nueva»; cada una dice si la IA la validó.
 */
export function SpeciesPhotos({ speciesId }: { speciesId: string }) {
  const state = useSpeciesPhotos(speciesId);
  const { colors } = useTheme();
  // Proporción de cada foto, que se conoce al cargarla; hasta entonces, 4:3.
  const [ratios, setRatios] = useState<Record<string, number>>({});

  if (state.status === 'loading') return <StickerGridSkeleton count={3} />;
  if (state.status === 'error' || state.photos.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: colors.border }]}>
        <Icon name="image" color={colors.textSecondary} size={22} />
        <ThemedText variant="small" color="textSecondary" style={styles.flex}>
          {state.status === 'error'
            ? 'No se pudieron cargar tus fotos. Revisa tu conexión.'
            : 'Aquí verás las fotos que tomes de esta especie. Cada foto validada suma para su cromo.'}
        </ThemedText>
      </View>
    );
  }

  // Cada foto va a la columna más corta, como en el diseño.
  const columns: SpeciesPhoto[][] = [[], []];
  const heights = [0, 0];
  for (const photo of state.photos) {
    const column = heights[0]! <= heights[1]! ? 0 : 1;
    columns[column]!.push(photo);
    heights[column]! += 1 / (ratios[photo.sightingId] ?? 4 / 3);
  }

  return (
    <View style={styles.columns}>
      {columns.map((column, c) => (
        <View key={c} style={styles.column}>
          {column.map((photo) => (
            <View key={photo.sightingId} style={styles.item}>
              <View
                style={[styles.photo, { aspectRatio: ratios[photo.sightingId] ?? 4 / 3, backgroundColor: colors.surfaceAlt }]}
                accessible
                accessibilityRole="image"
                accessibilityLabel={`Foto del ${formatShortDate(photo.takenAt)}${photo.placeName ? ` en ${photo.placeName}` : ''}, ${photo.waiting ? 'en espera de señal' : photo.status === 'validated' ? 'validada' : photo.status === 'pending' ? 'en revisión' : 'no cuenta para el cromo'}`}>
                <Image
                  source={{ uri: photo.url }}
                  style={styles.fill}
                  contentFit="contain"
                  onLoad={(e) => {
                    const ratio = e.source.width / e.source.height;
                    if (ratio > 0 && ratios[photo.sightingId] !== ratio) setRatios((r) => ({ ...r, [photo.sightingId]: ratio }));
                  }}
                />
                {photo.waiting ? (
                  <View style={[styles.newBadge, { backgroundColor: colors.textSecondary }]}>
                    <ThemedText variant="captionStrong" style={styles.white}>En espera</ThemedText>
                  </View>
                ) : photo === state.photos.find((p) => !p.waiting) && (
                  <View style={[styles.newBadge, { backgroundColor: WARNING }]}>
                    <ThemedText variant="captionStrong" style={styles.white}>Nueva</ThemedText>
                  </View>
                )}
                <View style={[styles.status, { backgroundColor: photo.status === 'validated' ? colors.success : photo.status === 'pending' ? colors.textSecondary : WARNING }]}>
                  {photo.waiting ? (
                    <Icon name="download" color="#FFFFFF" size={11} strokeWidth={3} />
                  ) : photo.status === 'validated' ? (
                    <Icon name="check" color="#FFFFFF" size={11} strokeWidth={3.2} />
                  ) : photo.status === 'pending' ? (
                    <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />
                  ) : (
                    <ThemedText variant="captionStrong" style={styles.white}>!</ThemedText>
                  )}
                </View>
              </View>
              {photo.waiting && (
                <ThemedText variant="captionStrong" color="textSecondary">Se sube cuando vuelvas a tener señal.</ThemedText>
              )}
              {photo.status === 'rejected' && (
                <ThemedText variant="captionStrong" style={{ color: WARNING }}>No se ve el ave. No cuenta para el cromo.</ThemedText>
              )}
              <ThemedText variant="caption" color="textSecondary">
                {formatShortDate(photo.takenAt)}{photo.placeName ? ` · ${photo.placeName}` : ''}
              </ThemedText>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  empty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.control,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  columns: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    gap: 11,
  },
  item: {
    gap: 4,
  },
  photo: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  newBadge: {
    position: 'absolute',
    left: 6,
    top: 6,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  status: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    transform: [{ scale: 0.6 }],
  },
  white: {
    color: '#FFFFFF',
  },
});
