import { Pressable, StyleSheet, View } from 'react-native';

import { habitatPreview, type HabitatSection } from '@plumario/core';
import { radius, spacing } from '@plumario/tokens';
import { BirdAvatar, Icon, ProgressBar, ThemedText, useTheme } from '@plumario/ui';

import { ALBUM_HABITAT_LABELS, stickerTint } from '@/constants/habitats';
import { STICKER_ART } from '@/constants/sticker-art';

const PREVIEW = 5;

/** Tarjeta de un hábitat en Álbum: avance, sus últimas aves y cuántas faltan (Album, TemaAlbum). */
export function HabitatCard({ section, onPress }: { section: HabitatSection; onPress: () => void }) {
  const { colors, shadows } = useTheme();
  const missing = section.total - section.registered;
  const label = ALBUM_HABITAT_LABELS[section.habitat];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${section.registered} de ${section.total}, ${missing} por descubrir`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.line, boxShadow: shadows.card },
        pressed && styles.pressed,
      ]}>
      <View style={styles.header}>
        <ThemedText variant="section">{label}</ThemedText>
        <View style={styles.count}>
          <ThemedText variant="label">{section.registered} de {section.total}</ThemedText>
          <Icon name="chevronRight" color={colors.text} size={16} strokeWidth={2.2} />
        </View>
      </View>
      <ProgressBar current={section.registered} total={section.total} showValue={false} size="thin" color={colors.habitats[section.habitat]} />
      <View style={styles.preview}>
        {habitatPreview(section, PREVIEW).map(({ species, sticker }) => (
          <BirdAvatar key={species.id} figure={species.figure} tint={stickerTint(species.habitat)} empty={!sticker} chromed={!!sticker?.chrome} size={36} art={STICKER_ART[species.id]} />
        ))}
        <ThemedText variant="caption" color="textSecondary" style={styles.missing}>
          {missing === 0 ? '¡Completo!' : `${missing} por descubrir`}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: spacing[3],
    gap: spacing[2],
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  missing: {
    marginLeft: 'auto',
  },
});
