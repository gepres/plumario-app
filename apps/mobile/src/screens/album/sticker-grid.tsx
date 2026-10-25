import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { AlbumEntry } from '@plumario/core';

import { SpeciesSticker, stickerLabel } from '@/components/species-sticker';

// Rejilla de stickers de 3 columnas (HabitatLitoral): 108 de ancho con 21 de margen en la pantalla
// de 390; en pantallas más angostas el sticker se achica para que entren las tres.
const COLUMNS = 3;
const SIDE = 21;
const MIN_GAP = 12;
const MAX_SIZE = 108;

export function useStickerSize() {
  const { width } = useWindowDimensions();
  return Math.min(MAX_SIZE, Math.floor((width - SIDE * 2 - MIN_GAP * (COLUMNS - 1)) / COLUMNS));
}

/** Un sticker que se toca: abre su galería si ya lo tiene, o la hoja para completarlo si no. */
export function StickerCell({ entry, size, onPress }: { entry: AlbumEntry; size: number; onPress: (entry: AlbumEntry) => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={stickerLabel(entry)} onPress={() => onPress(entry)} style={({ pressed }) => [styles.cell, pressed && styles.pressed]}>
      <SpeciesSticker entry={entry} size={size} />
    </Pressable>
  );
}

/** Rejilla sin desplazamiento propio, para listas cortas dentro de otra (resultados de búsqueda). */
export function StickerGrid({ entries, onPress }: { entries: readonly AlbumEntry[]; onPress: (entry: AlbumEntry) => void }) {
  const size = useStickerSize();
  return (
    <View style={styles.grid}>
      {entries.map((entry) => (
        <StickerCell key={entry.species.id} entry={entry} size={size} onPress={onPress} />
      ))}
      {/* Huecos para que la última fila quede alineada a la izquierda. */}
      {Array.from({ length: (COLUMNS - (entries.length % COLUMNS)) % COLUMNS }, (_, i) => (
        <View key={`gap${i}`} style={{ width: size }} />
      ))}
    </View>
  );
}

export const GRID_SIDE = SIDE;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    paddingHorizontal: SIDE - 16,
  },
  cell: {
    borderRadius: 14,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
