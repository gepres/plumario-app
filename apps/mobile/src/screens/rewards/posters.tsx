import { Pressable, StyleSheet, View } from 'react-native';

import type { AlbumView, Habitat, PostersView } from '@plumario/core';
import { radius, spacing } from '@plumario/tokens';
import { HabitatPoster, Icon, PosterFrame, ProgressBar, SpeciesPoster, ThemedText, useTheme } from '@plumario/ui';

import { DEFAULT_POSTER_TITLE, habitatPosterCells, speciesPosterProps } from '@/components/poster-content';
import { formatDayMonth } from '@/constants/cards';
import { ALBUM_HABITAT_LABELS } from '@/constants/habitats';

type Props = {
  album: AlbumView;
  posters: PostersView;
  collector: string;
  onOpenPoster: (id: string) => void;
  onGenerate: (number: number) => void;
  onOpenHabitat: (habitat: Habitat) => void;
};

const THUMB = { width: 60, shadow: '0 1px 2px rgba(20,48,47,0.22), 0 4px 10px rgba(20,48,47,0.14)' };

/** RecompensasPosteres: los de cada 10 especies y uno por hábitat. */
export function Posters({ album, posters, collector, onOpenPoster, onGenerate, onOpenHabitat }: Props) {
  const { colors } = useTheme();
  const saved = posters.species.filter((p) => p.status === 'saved').length;
  const unlockedHabitats = posters.habitats.filter((h) => h.unlocked).length;
  return (
    <View style={styles.root}>
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <ThemedText variant="section" accessibilityRole="header">Cada 10 especies</ThemedText>
          <ThemedText variant="small" color="textSecondary">{saved} {saved === 1 ? 'guardado' : 'guardados'}</ThemedText>
        </View>
        <ThemedText variant="caption" color="textSecondary">Al llegar a 10, 20, 30… especies se arma un póster con 10 de tus stickers al azar.</ThemedText>
        <View style={styles.grid}>
          {posters.species.map((slot) => {
            if (slot.status === 'saved') {
              const props = speciesPosterProps(album, { ...slot.poster, number: slot.number }, collector);
              return (
                <Pressable
                  key={slot.number}
                  accessibilityRole="button"
                  accessibilityLabel={`Póster ${slot.number}, guardado el ${formatDayMonth(slot.poster.savedAt)}. Descargar`}
                  onPress={() => onOpenPoster(slot.poster.id)}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                  <PosterFrame width={THUMB.width} style={[styles.thumb, { boxShadow: THUMB.shadow }]}>
                    <SpeciesPoster {...props} />
                  </PosterFrame>
                  <View style={styles.flex}>
                    <ThemedText variant="bodyStrong">Póster {slot.number}</ThemedText>
                    <ThemedText variant="caption" color="textSecondary">Guardado · {formatDayMonth(slot.poster.savedAt)}</ThemedText>
                    <ThemedText variant="label" color="primary">Descargar</ThemedText>
                  </View>
                </Pressable>
              );
            }
            if (slot.status === 'ready') {
              const props = speciesPosterProps(album, { number: slot.number, seed: 7, theme: 'light', title: DEFAULT_POSTER_TITLE }, collector);
              return (
                <Pressable
                  key={slot.number}
                  accessibilityRole="button"
                  accessibilityLabel={`Póster ${slot.number}, listo para armar`}
                  onPress={() => onGenerate(slot.number)}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.text, borderWidth: 1.5 }]}>
                  <PosterFrame width={THUMB.width} style={[styles.thumb, { boxShadow: THUMB.shadow }]}>
                    <SpeciesPoster {...props} />
                  </PosterFrame>
                  <View style={styles.flex}>
                    <ThemedText variant="bodyStrong">Póster {slot.number}</ThemedText>
                    <ThemedText variant="caption" color="textSecondary">¡Listo para armar!</ThemedText>
                    <ThemedText variant="label" color="primary">Generar</ThemedText>
                  </View>
                </Pressable>
              );
            }
            const props = speciesPosterProps(album, { number: slot.number, seed: 7, theme: 'light', title: DEFAULT_POSTER_TITLE }, collector);
            return (
              <View key={slot.number} style={[styles.card, styles.next, { borderColor: colors.border }]} accessible accessibilityLabel={`Póster ${slot.number}, ${slot.registered} de ${slot.goal} especies`}>
                <PosterFrame width={THUMB.width} style={[styles.thumb, styles.dim]}>
                  <SpeciesPoster {...props} />
                </PosterFrame>
                <View style={styles.flex}>
                  <ThemedText variant="bodyStrong">Póster {slot.number}</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">{slot.registered} de {slot.goal} especies</ThemedText>
                  <ProgressBar current={slot.registered} total={slot.goal} showValue={false} size="thin" color={colors.text} />
                  <ThemedText variant="captionStrong">Te faltan {slot.goal - slot.registered}</ThemedText>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <ThemedText variant="section" accessibilityRole="header">Por hábitat</ThemedText>
          <ThemedText variant="small" color="textSecondary">{unlockedHabitats} de {posters.habitats.length}</ThemedText>
        </View>
        <ThemedText variant="caption" color="textSecondary">
          Se habilita al completar todas las especies del hábitat. Antes, puedes verlo con las que faltan en sombra.
        </ThemedText>
        {posters.habitats.map((slot, i) => {
          const section = album.habitats.find((h) => h.habitat === slot.habitat)!;
          const highlighted = slot.unlocked || (i === 0 && unlockedHabitats === 0);
          return (
            <Pressable
              key={slot.habitat}
              accessibilityRole="button"
              accessibilityLabel={`${ALBUM_HABITAT_LABELS[slot.habitat]}, ${slot.registered} de ${slot.total} especies. Ver vista previa`}
              onPress={() => onOpenHabitat(slot.habitat)}
              style={[
                styles.habitat,
                highlighted ? { backgroundColor: colors.surface, borderColor: colors.text } : { backgroundColor: colors.surfaceAlt, borderColor: 'transparent' },
              ]}>
              <PosterFrame width={32} style={styles.thumb}>
                <HabitatPoster habitat={slot.habitat} theme="light" name={ALBUM_HABITAT_LABELS[slot.habitat]} collector={collector} cells={habitatPosterCells(section, 'number', 7)} thumbnail />
              </PosterFrame>
              <View style={styles.flex}>
                <View style={styles.habitatHead}>
                  <ThemedText variant="bodyStrong">{ALBUM_HABITAT_LABELS[slot.habitat]}</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">{slot.registered} de {slot.total}</ThemedText>
                </View>
                <ProgressBar current={slot.registered} total={slot.total} showValue={false} size="thin" color={colors.habitats[slot.habitat]} />
              </View>
              <Icon name={slot.unlocked ? 'download' : 'lock'} color={colors.textSecondary} size={16} strokeWidth={2.2} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 14,
  },
  section: {
    gap: spacing[2],
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  card: {
    width: '48.5%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: spacing[2],
    paddingLeft: spacing[2],
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  next: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  thumb: {
    borderRadius: 2,
  },
  dim: {
    opacity: 0.85,
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  habitat: {
    borderWidth: 1.5,
    borderRadius: radius.control,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  habitatHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
});
