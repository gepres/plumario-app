import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { categoryOf, figureOf, formatAlbumNumber } from '@plumario/core';
import { spacing } from '@plumario/tokens';
import { BirdSticker, ThemedText, type BirdArt } from '@plumario/ui';

import { stickerTint } from '@/constants/habitats';

import { ILLUSTRATION_MODELS, PILOT_SPECIES } from './pilot-data';

const SIZE = 116;
const CATEGORY_LABELS = { holographic: 'holográfico', silver: 'plata', gold: 'oro', ruby: 'rubí', diamond: 'diamante' } as const;

/** Piloto (PA-30): el sticker de 6 especies con la figura de hoy, con vectores (A) y con IA (B). */
export function StickerPilot() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}>
      <ThemedText variant="title">Un dibujo por especie</ThemedText>
      <ThemedText variant="caption" color="textSecondary">
        Hoy: la figura de su grupo. A: vectores en el estilo del diseño. B: ilustración de Gemini. La sombra sigue siendo la silueta del grupo.
      </ThemedText>
      {PILOT_SPECIES.map((species) => {
        const figure = figureOf(species);
        const category = categoryOf(species);
        const common = { figure, name: species.commonName, number: formatAlbumNumber(species.albumNumber), tint: stickerTint(species.habitat), size: SIZE };
        const vector: BirdArt = { xml: species.vector };
        const columns: { label: string; node: ReactNode }[] = [
          { label: 'Hoy', node: <BirdSticker {...common} /> },
          { label: 'A · normal', node: <BirdSticker {...common} art={vector} /> },
          { label: `A · ${CATEGORY_LABELS[category]}`, node: <BirdSticker {...common} art={vector} finish={category} /> },
          ...ILLUSTRATION_MODELS.map((model, i) => {
            const image = species.illustrations[i];
            return {
              label: `B · ${model}`,
              node: image ? (
                <BirdSticker {...common} art={{ image }} />
              ) : (
                <View style={[styles.missing, { width: SIZE, height: (SIZE * 205) / 160 }]}>
                  <ThemedText variant="caption" color="textSecondary" style={styles.center}>Sin generar</ThemedText>
                </View>
              ),
            };
          }),
          { label: 'Sombra', node: <BirdSticker {...common} empty /> },
        ];
        return (
          <View key={species.id} style={styles.species}>
            <ThemedText variant="section">{species.commonName}</ThemedText>
            <ThemedText variant="scientific" color="textSecondary">{species.scientificName} · {figure}</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {columns.map(({ label, node }) => (
                <View key={label} style={styles.column}>
                  {node}
                  <ThemedText variant="caption" color="textSecondary">{label}</ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing[4], gap: spacing[3] },
  species: { gap: spacing[1], marginTop: spacing[3] },
  row: { gap: spacing[3], paddingVertical: spacing[2] },
  column: { alignItems: 'center', gap: spacing[2] },
  missing: { borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#B9B4AA', alignItems: 'center', justifyContent: 'center', padding: spacing[2] },
  center: { textAlign: 'center' },
});
