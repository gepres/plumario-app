import * as Haptics from 'expo-haptics';
import { router, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import Svg, { Circle, Rect } from 'react-native-svg';

import type { EarnedAchievement } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { Button, Icon, Medal, Rays, ThemedText, useTheme } from '@plumario/ui';

import { achievementCelebration, medalKind } from '@/constants/achievements';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

/**
 * Celebracion: al ganar una medalla aparece una celebración breve, una por logro, sobre lo que esté
 * en pantalla. No interrumpe el registro (su resultado ya celebra) y espera a que termine.
 */
export function CelebrationHost() {
  const { achievements } = useDependencies();
  const userId = useSession()?.uid;
  const segments = useSegments();
  const [pending, setPending] = useState<readonly EarnedAchievement[]>([]);
  const registering = segments[0] === 'new-sighting';

  useEffect(() => {
    if (!userId) return;
    return achievements.watchUnseen(userId, (list) => setPending([...list].sort((a, b) => a.earnedAt.getTime() - b.earnedAt.getTime())));
  }, [achievements, userId]);

  const current = !registering ? pending[0] : undefined;

  useEffect(() => {
    if (current) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [current]);

  if (!current || !userId) return null;
  const dismiss = () => {
    setPending((list) => list.filter((a) => a.id !== current.id));
    void achievements.markSeen(userId, current.id).catch(() => undefined);
  };
  return <Celebration key={current.id} earned={current} onClose={dismiss} onSeeReward={() => { dismiss(); router.navigate('/rewards'); }} />;
}

function Celebration({ earned, onClose, onSeeReward }: { earned: EarnedAchievement; onClose: () => void; onSeeReward: () => void }) {
  const { colors } = useTheme();
  const { achievement } = earned;
  const { title, text } = achievementCelebration(achievement);
  const withPoster = achievement.kind === 'milestone';
  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={styles.pill}>
          <Icon name="check" color="#F3EDE2" size={16} strokeWidth={2.4} />
          <ThemedText variant="captionStrong" style={{ color: '#F3EDE2' }}>Medalla desbloqueada</ThemedText>
        </View>
        <View accessibilityViewIsModal accessibilityRole="alert" style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.stage, { backgroundColor: colors.surfaceAlt }]}>
            <View style={styles.rays} pointerEvents="none">
              <Rays size={420} color="rgba(255,255,255,0.6)" fade={colors.surfaceAlt} step={9} />
            </View>
            <Svg width="100%" height={200} viewBox="0 0 358 200" style={styles.confetti} pointerEvents="none">
              <Rect x={30} y={26} width={12} height={4} rx={1} fill="#A0541F" transform="rotate(28 36 28)" />
              <Rect x={306} y={34} width={12} height={4} rx={1} fill="#2C6A86" transform="rotate(-34 312 36)" />
              <Rect x={66} y={180} width={10} height={4} rx={1} fill="#3D7A55" transform="rotate(-18 71 182)" />
              <Rect x={296} y={174} width={10} height={4} rx={1} fill="#A0541F" transform="rotate(-60 301 176)" />
              <Circle cx={250} cy={24} r={3} fill="#C5D9F5" />
              <Circle cx={70} cy={80} r={2.5} fill="#E4C766" />
              <Circle cx={300} cy={120} r={2.5} fill="#F4C6D6" />
            </Svg>
            <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.tilt}>
              <Medal kind={medalKind(achievement)} number={achievement.kind === 'milestone' ? achievement.species : undefined} size={124} />
            </Animated.View>
          </View>
          <View style={styles.texts}>
            <ThemedText variant="eyebrow" style={[styles.center, { color: '#8A4F12' }]}>{withPoster ? 'Medalla y póster desbloqueados' : 'Medalla desbloqueada'}</ThemedText>
            <ThemedText variant="reveal" style={styles.center}>{title}</ThemedText>
            <ThemedText color="textSecondary" style={styles.center}>{text}</ThemedText>
          </View>
          {withPoster && (
            <View style={[styles.poster, { backgroundColor: colors.background }]}>
              <View style={[styles.posterThumb, { backgroundColor: colors.hero.stops[0]!.color }]}>
                <ThemedText variant="captionStrong" style={{ color: colors.onHero }}>{achievement.species / 10}</ThemedText>
              </View>
              <View style={styles.flex}>
                <ThemedText variant="bodyStrong">Póster {achievement.species / 10}</ThemedText>
                <ThemedText variant="caption" color="textSecondary">10 de tus stickers en un póster A3. El próximo, a las {achievement.species + 10}.</ThemedText>
              </View>
            </View>
          )}
          <View style={styles.actions}>
            <Button label="Ver recompensa" onPress={onSeeReward} />
            <Button label="Seguir explorando" variant="tertiary" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(10,24,24,0.7)',
    justifyContent: 'center',
    paddingHorizontal: layout.cardMargin,
    gap: spacing[4],
  },
  pill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: 14,
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: 'rgba(251,248,242,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,248,242,0.28)',
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
  },
  stage: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rays: {
    position: 'absolute',
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tilt: {
    transform: [{ rotate: '-5deg' }],
  },
  texts: {
    paddingTop: spacing[5],
    paddingHorizontal: spacing[6],
    gap: 6,
  },
  center: {
    textAlign: 'center',
  },
  poster: {
    marginTop: spacing[4],
    marginHorizontal: spacing[6],
    padding: spacing[3],
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  posterThumb: {
    width: 40,
    height: 57,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  actions: {
    padding: spacing[5],
    paddingTop: spacing[5],
    gap: 10,
  },
});

