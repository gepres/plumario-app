import { Pressable, StyleSheet, View } from 'react-native';

import { achievementId, type RewardsView } from '@plumario/core';
import { spacing } from '@plumario/tokens';
import { Icon, Medal, ProgressBar, ThemedText, useTheme } from '@plumario/ui';

import { achievementLabel, achievementTitle, medalKind } from '@/constants/achievements';
import { formatShortDate } from '@/constants/cards';

type Props = {
  rewards: RewardsView;
  onOpenAlbum: () => void;
  /** Compartir una medalla obtenida (TarjetaLogro). */
  onShareMedal: (achievementId: string) => void;
};

/** Main · Medallas: las obtenidas y las que faltan, con la más cercana destacada. */
export function Medals({ rewards, onOpenAlbum, onShareMedal }: Props) {
  const { colors } = useTheme();
  const pending = [...rewards.habitats, ...(rewards.album ? [rewards.album] : [])];
  return (
    <View style={styles.root}>
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <ThemedText variant="section" accessibilityRole="header">Obtenidas</ThemedText>
          <ThemedText variant="small" color="textSecondary">{rewards.earned.length}</ThemedText>
        </View>
        {rewards.earned.length === 0 ? (
          <ThemedText variant="small" color="textSecondary">Registra tu primera ave para ganar tu primera medalla.</ThemedText>
        ) : (
          <View style={styles.grid}>
            {rewards.earned.map(({ achievement, earnedAt }) => (
              <Pressable
                key={achievementId(achievement)}
                accessibilityRole="button"
                accessibilityLabel={`${achievementTitle(achievement)}${earnedAt ? `, obtenida el ${formatShortDate(earnedAt)}` : ''}. Compartir`}
                onPress={() => onShareMedal(achievementId(achievement))}
                style={[styles.earned, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Medal kind={medalKind(achievement)} number={achievement.kind === 'milestone' ? achievement.species : undefined} size={54} />
                <ThemedText variant="label" style={styles.center}>{achievementLabel(achievement)}</ThemedText>
                {earnedAt && <ThemedText variant="caption" color="textSecondary">{formatShortDate(earnedAt)}</ThemedText>}
                <View style={styles.share}>
                  <Icon name="share" color={colors.primary} size={13} strokeWidth={2.2} />
                  <ThemedText variant="captionStrong" color="primary">Compartir</ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <ThemedText variant="section" accessibilityRole="header">Por conseguir</ThemedText>
          <ThemedText variant="small" color="textSecondary">{pending.length + (rewards.closest ? 1 : 0)} en camino</ThemedText>
        </View>
        {rewards.closest && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`La más cercana: ${achievementTitle(rewards.closest.achievement)}, ${rewards.closest.current} de ${rewards.closest.goal}`}
            onPress={onOpenAlbum}
            style={[styles.closest, { backgroundColor: colors.surface, borderColor: colors.text }]}>
            <Medal
              kind={medalKind(rewards.closest.achievement)}
              number={rewards.closest.achievement.kind === 'milestone' ? rewards.closest.achievement.species : undefined}
              size={58}
              locked
              progress={rewards.closest.current / rewards.closest.goal}
            />
            <View style={styles.flex}>
              <ThemedText variant="eyebrow" color="primary">La más cercana</ThemedText>
              <ThemedText variant="bodyStrong">{achievementTitle(rewards.closest.achievement)}</ThemedText>
              <ProgressBar current={rewards.closest.current} total={rewards.closest.goal} size="thin" color={colors.text} />
            </View>
          </Pressable>
        )}
        <View style={styles.grid}>
          {pending.map((medal) => (
            <View
              key={achievementId(medal.achievement)}
              accessible
              accessibilityLabel={`${achievementTitle(medal.achievement)}, ${medal.current} de ${medal.goal}`}
              style={[styles.locked, { backgroundColor: colors.surfaceAlt }]}>
              <Medal kind={medalKind(medal.achievement)} size={48} locked progress={medal.goal ? medal.current / medal.goal : 0} />
              <ThemedText variant="label" style={styles.center}>{achievementLabel(medal.achievement)}</ThemedText>
              <ThemedText variant="caption" color="textSecondary">{medal.current} de {medal.goal}</ThemedText>
            </View>
          ))}
        </View>
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
  earned: {
    width: '31.5%',
    flexGrow: 1,
    maxWidth: '33%',
    borderWidth: 1,
    borderRadius: 16,
    paddingTop: 10,
    paddingHorizontal: 6,
    paddingBottom: spacing[2],
    alignItems: 'center',
    gap: spacing[1],
  },
  share: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locked: {
    width: '31.5%',
    flexGrow: 1,
    maxWidth: '33%',
    borderRadius: 16,
    paddingVertical: spacing[2],
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 3,
  },
  closest: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  center: {
    width: '100%',
    textAlign: 'center',
  },
});

