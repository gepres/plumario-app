import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '@plumario/tokens';

import { useTheme } from '../theme/use-theme';
import { Icon } from './icon';
import { ThemedText } from './themed-text';

type Props = {
  title: string;
  body: string;
  /** Tocar el aviso: abre lo que avisa. */
  onPress?: () => void;
  onClose: () => void;
};

// Entra desde arriba y se va hacia arriba, como los avisos del sistema. Es ocasional (un aviso
// push con la app abierta), así que lleva animación; con «reducir movimiento», Reanimated la omite.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/** Aviso arriba de la pantalla: un aviso push que llegó con la app abierta. */
export function NoticeBanner({ title, body, onPress, onClose }: Props) {
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={FadeInUp.duration(240).easing(EASE_OUT)}
      exiting={FadeOutUp.duration(180).easing(EASE_OUT)}
      accessibilityLiveRegion="polite"
      style={[styles.wrap, { top: insets.top + 8 }]}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${title}. ${body}`}
        onPress={onPress}
        style={({ pressed }) => [styles.banner, { backgroundColor: colors.surface, borderColor: colors.line, boxShadow: shadows.card }, pressed && styles.pressed]}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
          <Icon name="bell" color={colors.primary} size={18} strokeWidth={2} />
        </View>
        <View style={styles.text}>
          <ThemedText variant="bodyStrong" numberOfLines={1}>{title}</ThemedText>
          <ThemedText variant="caption" color="textSecondary" numberOfLines={2}>{body}</ThemedText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar aviso" hitSlop={12} onPress={onClose} style={styles.close}>
          <Icon name="close" color={colors.textSecondary} size={16} strokeWidth={2.2} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: layout.cardMargin,
    right: layout.cardMargin,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pressed: {
    opacity: 0.9,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  close: {
    padding: 4,
  },
});
